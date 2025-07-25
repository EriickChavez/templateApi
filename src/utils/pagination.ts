import { FilterUsersDto } from '../dto/UserDto';
import { PaginationMeta, PaginatedResponseDto } from '../dto/BaseDto';

// Interface genérica para opciones de consulta
export interface QueryOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, any>;
}

// Interface para resultados de consulta paginada
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// Utility class para manejar paginación
export class PaginationHelper {
  // Calcular offset para SQL/MongoDB
  static calculateOffset(page: number, limit: number): number {
    return (page - 1) * limit;
  }

  // Crear metadata de paginación
  static createPaginationMeta(
    currentPage: number,
    itemsPerPage: number,
    totalItems: number
  ): PaginationMeta {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    return {
      currentPage,
      itemsPerPage,
      totalItems,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1
    };
  }

  // Validar y sanitizar parámetros de paginación
  static sanitizePaginationParams(params: Partial<QueryOptions>): QueryOptions {
    const page = Math.max(1, parseInt(String(params.page)) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(String(params.limit)) || 10));
    
    return {
      page,
      limit,
      sortBy: params.sortBy?.trim(),
      sortOrder: params.sortOrder === 'desc' ? 'desc' : 'asc',
      search: params.search?.trim(),
      filters: params.filters || {}
    };
  }

  // Crear respuesta paginada estandarizada
  static createPaginatedResponse<T>(
    data: T[],
    total: number,
    page: number,
    limit: number,
    message: string = 'Data retrieved successfully',
    correlationId?: string
  ): PaginatedResponseDto<T> {
    const paginationMeta = this.createPaginationMeta(page, limit, total);
    return new PaginatedResponseDto(data, paginationMeta, message, correlationId);
  }
}

// Builder para construir filtros de manera fluida
export class FilterBuilder {
  private filters: Record<string, any> = {};
  private searchFields: string[] = [];
  private dateFilters: Record<string, any> = {};

  // Agregar filtro exacto
  addExactFilter(field: string, value: any): FilterBuilder {
    if (value !== undefined && value !== null && value !== '') {
      this.filters[field] = value;
    }
    return this;
  }

  // Agregar filtro de texto (contiene)
  addTextFilter(field: string, value: string): FilterBuilder {
    if (value && value.trim()) {
      this.filters[field] = new RegExp(value.trim(), 'i'); // Para MongoDB
    }
    return this;
  }

  // Agregar filtro de rango de fechas
  addDateRangeFilter(field: string, after?: string, before?: string): FilterBuilder {
    const dateFilter: any = {};
    
    if (after) {
      dateFilter.$gte = new Date(after);
    }
    
    if (before) {
      dateFilter.$lte = new Date(before);
    }
    
    if (Object.keys(dateFilter).length > 0) {
      this.filters[field] = dateFilter;
    }
    
    return this;
  }

  // Agregar campos para búsqueda de texto completo
  addSearchFields(...fields: string[]): FilterBuilder {
    this.searchFields.push(...fields);
    return this;
  }

  // Aplicar búsqueda de texto en campos especificados
  applySearch(searchTerm: string): FilterBuilder {
    if (searchTerm && searchTerm.trim() && this.searchFields.length > 0) {
      const searchRegex = new RegExp(searchTerm.trim(), 'i');
      this.filters.$or = this.searchFields.map(field => ({
        [field]: searchRegex
      }));
    }
    return this;
  }

  // Construir filtros finales
  build(): Record<string, any> {
    return this.filters;
  }

  // Crear filtros específicos para usuarios
  static forUsers(dto: FilterUsersDto): Record<string, any> {
    const builder = new FilterBuilder();
    
    builder
      .addTextFilter('email', dto.email || '')
      .addExactFilter('role', dto.role)
      .addTextFilter('firstName', dto.firstName || '')
      .addTextFilter('lastName', dto.lastName || '')
      .addDateRangeFilter('createdAt', dto.createdAfter, dto.createdBefore)
      .addSearchFields('email', 'firstName', 'lastName')
      .applySearch(dto.search || '');
    
    return builder.build();
  }
}

// Helper para construir opciones de ordenamiento
export class SortBuilder {
  private sortOptions: Record<string, 1 | -1> = {};

  // Agregar campo de ordenamiento
  addSort(field: string, order: 'asc' | 'desc' = 'asc'): SortBuilder {
    this.sortOptions[field] = order === 'desc' ? -1 : 1;
    return this;
  }

  // Construir opciones de ordenamiento
  build(): Record<string, 1 | -1> {
    // Si no hay ordenamiento especificado, ordenar por fecha de creación descendente
    if (Object.keys(this.sortOptions).length === 0) {
      this.sortOptions.createdAt = -1;
    }
    return this.sortOptions;
  }

  // Crear ordenamiento desde parámetros de query
  static fromQueryParams(sortBy?: string, sortOrder?: 'asc' | 'desc'): Record<string, 1 | -1> {
    const builder = new SortBuilder();
    
    if (sortBy) {
      builder.addSort(sortBy, sortOrder);
    }
    
    return builder.build();
  }
}

// Validadores para parámetros de paginación
export const validatePaginationParams = (
  page?: any, 
  limit?: any
): { page: number; limit: number; errors: string[] } => {
  const errors: string[] = [];
  let validPage = 1;
  let validLimit = 10;

  // Validar página
  if (page !== undefined) {
    const pageNum = parseInt(String(page));
    if (isNaN(pageNum) || pageNum < 1) {
      errors.push('Page must be a positive integer');
    } else {
      validPage = pageNum;
    }
  }

  // Validar límite
  if (limit !== undefined) {
    const limitNum = parseInt(String(limit));
    if (isNaN(limitNum) || limitNum < 1) {
      errors.push('Limit must be a positive integer');
    } else if (limitNum > 100) {
      errors.push('Limit cannot exceed 100');
    } else {
      validLimit = limitNum;
    }
  }

  return { page: validPage, limit: validLimit, errors };
};

// Helper para crear URL de paginación
export const createPaginationUrls = (
  baseUrl: string,
  currentPage: number,
  totalPages: number,
  queryParams: Record<string, any> = {}
) => {
  const createUrl = (page: number) => {
    const params = new URLSearchParams({
      ...queryParams,
      page: page.toString()
    });
    return `${baseUrl}?${params.toString()}`;
  };

  return {
    self: createUrl(currentPage),
    first: createUrl(1),
    last: createUrl(totalPages),
    prev: currentPage > 1 ? createUrl(currentPage - 1) : null,
    next: currentPage < totalPages ? createUrl(currentPage + 1) : null
  };
};
