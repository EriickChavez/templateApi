import { Request, Response } from 'express';
import { plainToInstance } from 'class-transformer';
import { 
  UserResponseDto, 
  FilterUsersDto, 
  CreateUserDto, 
  UpdateUserDto,
  UserParamsDto,
  UserRole 
} from '../dto/UserDto';
import { BaseResponseDto, PaginatedResponseDto } from '../dto/BaseDto';
import { PaginationHelper, FilterBuilder, SortBuilder } from '../utils/pagination';
import { container } from '../infrastructure/di/Container';
import { UserRepository } from '../domain/repositories/UserRepository';

export class EnhancedUserController {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = container.get<UserRepository>('UserRepository');
  }

  // GET /users - Listar usuarios con paginación, filtros y ordenamiento
  async getUsers(req: Request, res: Response): Promise<void> {
    try {
      // Los datos ya están validados por el middleware
      const filters = (req as any).validatedQuery as FilterUsersDto;
      
      // Sanitizar parámetros de paginación
      const queryOptions = PaginationHelper.sanitizePaginationParams({
        page: filters.page,
        limit: filters.limit,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        search: filters.search
      });

      // Construir filtros de base de datos
      const dbFilters = FilterBuilder.forUsers(filters);
      
      // Construir opciones de ordenamiento
      const sortOptions = SortBuilder.fromQueryParams(
        queryOptions.sortBy, 
        queryOptions.sortOrder
      );

      // Calcular offset para paginación
      const offset = PaginationHelper.calculateOffset(
        queryOptions.page, 
        queryOptions.limit
      );

      // Obtener usuarios (esto dependería de tu implementación específica)
      // Para este ejemplo, simularemos la consulta
      const users = await this.getUsersFromDatabase(
        dbFilters, 
        sortOptions, 
        offset, 
        queryOptions.limit
      );
      
      const totalUsers = await this.countUsers(dbFilters);

      // Transformar entidades a DTOs de respuesta
      const userDtos = users.map(user => 
        plainToInstance(UserResponseDto, user, { 
          excludeExtraneousValues: true 
        })
      );

      // Crear respuesta paginada
      const response = PaginationHelper.createPaginatedResponse(
        userDtos,
        totalUsers,
        queryOptions.page,
        queryOptions.limit,
        'Users retrieved successfully',
        req.correlationId
      );

      res.json(response);
    } catch (error) {
      console.error('Error in getUsers:', error);
      
      const errorResponse = new BaseResponseDto(
        false,
        'Failed to retrieve users',
        null,
        { correlationId: req.correlationId },
        [{ message: error instanceof Error ? error.message : 'Unknown error' }]
      );

      res.status(500).json(errorResponse);
    }
  }

  // GET /users/:id - Obtener usuario específico
  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = (req as any).validatedParams as UserParamsDto;
      const currentUser = (req as any).user;

      // Verificar permisos: admin puede ver cualquier usuario, otros solo el suyo
      if (currentUser.role !== UserRole.ADMIN && currentUser.id !== id) {
        const forbiddenResponse = new BaseResponseDto(
          false,
          'Access denied: You can only view your own profile',
          null,
          { correlationId: req.correlationId }
        );

        res.status(403).json(forbiddenResponse);
        return;
      }

      const user = await this.userRepository.findById(id);

      if (!user) {
        const notFoundResponse = new BaseResponseDto(
          false,
          'User not found',
          null,
          { correlationId: req.correlationId }
        );

        res.status(404).json(notFoundResponse);
        return;
      }

      // Transformar a DTO de respuesta
      const userDto = plainToInstance(UserResponseDto, user, {
        excludeExtraneousValues: true
      });

      const response = new BaseResponseDto(
        true,
        'User retrieved successfully',
        userDto,
        {
          correlationId: req.correlationId,
          timestamp: new Date().toISOString(),
          version: req.apiVersion
        }
      );

      res.json(response);
    } catch (error) {
      console.error('Error in getUserById:', error);
      
      const errorResponse = new BaseResponseDto(
        false,
        'Failed to retrieve user',
        null,
        { correlationId: req.correlationId },
        [{ message: error instanceof Error ? error.message : 'Unknown error' }]
      );

      res.status(500).json(errorResponse);
    }
  }

  // POST /users - Crear nuevo usuario (Solo Admin)
  async createUser(req: Request, res: Response): Promise<void> {
    try {
      const userData = (req as any).validatedBody as CreateUserDto;
      const currentUser = (req as any).user;

      // Solo admins pueden crear usuarios
      if (currentUser.role !== UserRole.ADMIN) {
        const forbiddenResponse = new BaseResponseDto(
          false,
          'Access denied: Only administrators can create users',
          null,
          { correlationId: req.correlationId }
        );

        res.status(403).json(forbiddenResponse);
        return;
      }

      // Verificar si el email ya existe
      const existingUser = await this.findUserByEmail(userData.email);
      if (existingUser) {
        const conflictResponse = new BaseResponseDto(
          false,
          'User with this email already exists',
          null,
          { correlationId: req.correlationId },
          [{ field: 'email', constraints: ['Email must be unique'] }]
        );

        res.status(409).json(conflictResponse);
        return;
      }

      // Aquí iría la lógica de creación real
      // const newUser = await this.userRepository.create(userData);
      
      // Para este ejemplo, simularemos la creación
      const newUser = {
        id: `user_${Date.now()}`,
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Transformar a DTO de respuesta
      const userDto = plainToInstance(UserResponseDto, newUser, {
        excludeExtraneousValues: true
      });

      const response = new BaseResponseDto(
        true,
        'User created successfully',
        userDto,
        {
          correlationId: req.correlationId,
          timestamp: new Date().toISOString(),
          version: req.apiVersion
        }
      );

      res.status(201).json(response);
    } catch (error) {
      console.error('Error in createUser:', error);
      
      const errorResponse = new BaseResponseDto(
        false,
        'Failed to create user',
        null,
        { correlationId: req.correlationId },
        [{ message: error instanceof Error ? error.message : 'Unknown error' }]
      );

      res.status(500).json(errorResponse);
    }
  }

  // PUT /users/:id - Actualizar usuario
  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = (req as any).validatedParams as UserParamsDto;
      const updateData = (req as any).validatedBody as UpdateUserDto;
      const currentUser = (req as any).user;

      // Verificar permisos
      if (currentUser.role !== UserRole.ADMIN && currentUser.id !== id) {
        const forbiddenResponse = new BaseResponseDto(
          false,
          'Access denied: You can only update your own profile',
          null,
          { correlationId: req.correlationId }
        );

        res.status(403).json(forbiddenResponse);
        return;
      }

      // Solo admins pueden cambiar roles
      if (updateData.role && currentUser.role !== UserRole.ADMIN) {
        const forbiddenResponse = new BaseResponseDto(
          false,
          'Access denied: Only administrators can change user roles',
          null,
          { correlationId: req.correlationId }
        );

        res.status(403).json(forbiddenResponse);
        return;
      }

      const existingUser = await this.userRepository.findById(id);
      if (!existingUser) {
        const notFoundResponse = new BaseResponseDto(
          false,
          'User not found',
          null,
          { correlationId: req.correlationId }
        );

        res.status(404).json(notFoundResponse);
        return;
      }

      // Aquí iría la lógica de actualización real
      const updatedUser = {
        ...existingUser,
        ...updateData,
        updatedAt: new Date()
      };

      // Transformar a DTO de respuesta
      const userDto = plainToInstance(UserResponseDto, updatedUser, {
        excludeExtraneousValues: true
      });

      const response = new BaseResponseDto(
        true,
        'User updated successfully',
        userDto,
        {
          correlationId: req.correlationId,
          timestamp: new Date().toISOString(),
          version: req.apiVersion
        }
      );

      res.json(response);
    } catch (error) {
      console.error('Error in updateUser:', error);
      
      const errorResponse = new BaseResponseDto(
        false,
        'Failed to update user',
        null,
        { correlationId: req.correlationId },
        [{ message: error instanceof Error ? error.message : 'Unknown error' }]
      );

      res.status(500).json(errorResponse);
    }
  }

  // Métodos helper privados (simulados para este ejemplo)
  private async getUsersFromDatabase(
    filters: any, 
    sortOptions: any, 
    offset: number, 
    limit: number
  ): Promise<any[]> {
    // Aquí iría tu lógica real de base de datos
    // Por ahora simulamos algunos usuarios
    const allUsers = [
      {
        id: '1',
        email: 'admin@test.com',
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.ADMIN,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        id: '2', 
        email: 'user@test.com',
        firstName: 'Regular',
        lastName: 'User',
        role: UserRole.USER,
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02')
      }
    ];

    // Aplicar filtros y paginación básica
    return allUsers.slice(offset, offset + limit);
  }

  private async countUsers(filters: any): Promise<number> {
    // Simular conteo
    return 2;
  }

  private async findUserByEmail(email: string): Promise<any | null> {
    // Simular búsqueda por email
    return null;
  }
}
