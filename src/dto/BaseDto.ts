import { IsOptional, IsString, IsNumber, Min, IsEnum } from 'class-validator';
import { Transform, Type } from 'class-transformer';

// Enums para tipos comunes
export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc'
}

// Base DTO para paginación
export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.ASC;

  @IsOptional()
  @IsString()
  search?: string;
}

// Base Response DTO
export class BaseResponseDto<T> {
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    pagination?: PaginationMeta;
    timestamp: string;
    correlationId?: string;
    version: string;
    requestId?: string;
  };
  errors?: any[];

  constructor(
    success: boolean, 
    message: string, 
    data?: T, 
    meta?: any, 
    errors?: any[]
  ) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.meta = {
      timestamp: new Date().toISOString(),
      version: 'v1',
      ...meta
    };
    this.errors = errors;
  }
}

// Metadata para paginación
export interface PaginationMeta {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// DTO para respuestas paginadas
export class PaginatedResponseDto<T> extends BaseResponseDto<T[]> {
  constructor(
    data: T[],
    pagination: PaginationMeta,
    message: string = 'Data retrieved successfully',
    correlationId?: string
  ) {
    super(true, message, data, { 
      pagination,
      correlationId 
    });
  }
}

// Decorator personalizado para transformar strings a números
export function ToNumber() {
  return Transform(({ value }) => {
    if (typeof value === 'string') {
      const num = Number(value);
      return isNaN(num) ? value : num;
    }
    return value;
  });
}

// Decorator para transformar strings a booleanos
export function ToBoolean() {
  return Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  });
}
