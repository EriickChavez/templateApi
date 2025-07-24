import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { AuthUtils } from '../utils/auth';
import { ResponseUtil } from '../utils/response';
import { HttpStatus } from '../types';
import { User, UserRole, UserStatus } from '../domain/entities/User';
import { Email } from '../domain/value-objects/Email';
import { PersonName } from '../domain/value-objects/PersonName';
import { UserRepository } from '../domain/repositories/UserRepository';
import { container } from '../infrastructure/di/Container';

export class DatabaseAuthController extends BaseController {
  private get userRepository(): UserRepository {
    return container.getUserRepository();
  }

  constructor() {
    super();
  }

  /**
   * Registro de nuevos usuarios con validación mejorada
   */
  register = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { email, password, firstName, lastName, middleName } = this.validateBody<{
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        middleName?: string;
      }>(req, ['email', 'password', 'firstName', 'lastName']);

      // Validar fortaleza de la contraseña
      const passwordValidation = AuthUtils.validatePasswordStrength(password);
      if (!passwordValidation.isValid) {
        return ResponseUtil.error(res, passwordValidation.errors.join(', '), HttpStatus.BAD_REQUEST);
      }

      // Crear objetos de valor
      const emailVO = new Email(email);
      const nameVO = new PersonName({ firstName, lastName, middleName });

      // Verificar si el usuario ya existe
      const existingUser = await this.userRepository.findByEmail(emailVO);
      if (existingUser) {
        return ResponseUtil.error(res, 'El email ya está registrado', HttpStatus.CONFLICT);
      }

      // Encriptar contraseña
      const passwordHash = await AuthUtils.hashPassword(password);

      // Verificar si es el primer usuario (será admin automáticamente)
      const totalUsers = await this.userRepository.count();
      const userRole = totalUsers === 0 ? UserRole.ADMIN : UserRole.USER;

      // Crear usuario
      const user = new User({
        email: emailVO,
        name: nameVO,
        role: userRole,
        status: UserStatus.ACTIVE,
        passwordHash,
        isEmailVerified: totalUsers === 0 // El primer usuario se verifica automáticamente
      });

      // Log especial para el primer admin
      if (totalUsers === 0) {
        console.log('👑 PRIMER USUARIO REGISTRADO - ASIGNADO COMO ADMIN:', {
          email: emailVO.value,
          name: nameVO.getFullName(),
          role: UserRole.ADMIN,
          repository: this.userRepository.constructor.name,
          timestamp: new Date().toISOString()
        });
      }

      // Guardar usuario en la base de datos
      const savedUser = await this.userRepository.save(user);

      // Generar token
      const token = AuthUtils.generateToken({
        userId: savedUser.id,
        email: savedUser.email.value,
        role: savedUser.role
      });

      return ResponseUtil.success(res, {
        user: {
          id: savedUser.id,
          email: savedUser.email.value,
          name: savedUser.displayName,
          role: savedUser.role,
          status: savedUser.status,
          isEmailVerified: savedUser.isEmailVerified,
          createdAt: savedUser.createdAt
        },
        token,
        isFirstUser: totalUsers === 0
      }, totalUsers === 0 ? '👑 Primer usuario registrado como ADMIN' : 'Usuario registrado exitosamente', HttpStatus.CREATED);

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error en el registro';
      console.error('❌ Error en registro:', {
        error: message,
        repository: this.userRepository.constructor.name,
        timestamp: new Date().toISOString()
      });
      return ResponseUtil.error(res, message, HttpStatus.BAD_REQUEST);
    }
  };

  /**
   * Login de usuarios con validación de bloqueo
   */
  login = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { email, password } = this.validateBody<{
        email: string;
        password: string;
      }>(req, ['email', 'password']);

      // Buscar usuario por email
      const emailVO = new Email(email);
      const user = await this.userRepository.findByEmail(emailVO);

      if (!user) {
        return ResponseUtil.error(res, 'Credenciales inválidas', HttpStatus.UNAUTHORIZED);
      }

      // Verificar si el usuario está bloqueado (solo para repositorios que lo soporten)
      if ('isUserLocked' in this.userRepository) {
        const isLocked = await (this.userRepository as any).isUserLocked(email);
        if (isLocked) {
          return ResponseUtil.error(res, 'Cuenta temporalmente bloqueada por múltiples intentos fallidos', HttpStatus.FORBIDDEN);
        }
      }

      // Verificar si el usuario está activo
      if (!user.isActive()) {
        return ResponseUtil.error(res, 'Cuenta desactivada. Contacte al administrador', HttpStatus.FORBIDDEN);
      }

      // Verificar contraseña
      const isValidPassword = await AuthUtils.comparePassword(password, (user as any)._passwordHash || '');
      
      if (!isValidPassword) {
        // Incrementar intentos fallidos si el repositorio lo soporta
        if ('incrementLoginAttempts' in this.userRepository) {
          await (this.userRepository as any).incrementLoginAttempts(email);
        }
        
        return ResponseUtil.error(res, 'Credenciales inválidas', HttpStatus.UNAUTHORIZED);
      }

      // Actualizar último login
      user.updateLastLogin();
      
      // Si el repositorio soporta actualización de último login, usarlo
      if ('updateLastLogin' in this.userRepository) {
        await (this.userRepository as any).updateLastLogin(user.id);
      } else {
        await this.userRepository.update(user);
      }

      // Generar token
      const token = AuthUtils.generateToken({
        userId: user.id,
        email: user.email.value,
        role: user.role
      });

      // Log de login exitoso
      console.log('✅ Login exitoso:', {
        userId: user.id,
        email: user.email.value,
        role: user.role,
        repository: this.userRepository.constructor.name,
        timestamp: new Date().toISOString()
      });

      return ResponseUtil.success(res, {
        user: {
          id: user.id,
          email: user.email.value,
          name: user.displayName,
          role: user.role,
          status: user.status,
          avatar: user.avatar,
          lastLoginAt: user.lastLoginAt,
          isEmailVerified: user.isEmailVerified
        },
        token
      }, 'Login exitoso', HttpStatus.OK);

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error en el login';
      console.error('❌ Error en login:', {
        error: message,
        repository: this.userRepository.constructor.name,
        timestamp: new Date().toISOString()
      });
      return ResponseUtil.error(res, message, HttpStatus.BAD_REQUEST);
    }
  };

  /**
   * Obtener información del usuario actual
   */
  me = async (req: Request, res: Response): Promise<Response> => {
    try {
      if (!req.user) {
        return ResponseUtil.error(res, 'Usuario no autenticado', HttpStatus.UNAUTHORIZED);
      }

      const user = await this.userRepository.findById(req.user.userId);
      if (!user) {
        return ResponseUtil.error(res, 'Usuario no encontrado', HttpStatus.NOT_FOUND);
      }

      return ResponseUtil.success(res, {
        id: user.id,
        email: user.email.value,
        name: user.displayName,
        initials: user.initials,
        role: user.role,
        status: user.status,
        avatar: user.avatar,
        lastLoginAt: user.lastLoginAt,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        version: user.version,
        // Información adicional según el rol
        permissions: this.getUserPermissions(user.role),
        canPerform: {
          create: user.canPerform('create'),
          read: user.canPerform('read'),
          update: user.canPerform('update'),
          delete: user.canPerform('delete'),
          moderate: user.canPerform('moderate')
        }
      }, 'Información del usuario obtenida exitosamente');

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al obtener información del usuario';
      return ResponseUtil.error(res, message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  };

  /**
   * Cambiar contraseña con validación mejorada
   */
  changePassword = async (req: Request, res: Response): Promise<Response> => {
    try {
      if (!req.user) {
        return ResponseUtil.error(res, 'Usuario no autenticado', HttpStatus.UNAUTHORIZED);
      }

      const { currentPassword, newPassword } = this.validateBody<{
        currentPassword: string;
        newPassword: string;
      }>(req, ['currentPassword', 'newPassword']);

      // Validar nueva contraseña
      const passwordValidation = AuthUtils.validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        return ResponseUtil.error(res, passwordValidation.errors.join(', '), HttpStatus.BAD_REQUEST);
      }

      const user = await this.userRepository.findById(req.user.userId);
      if (!user) {
        return ResponseUtil.error(res, 'Usuario no encontrado', HttpStatus.NOT_FOUND);
      }

      // Verificar contraseña actual
      const isCurrentPasswordValid = await AuthUtils.comparePassword(currentPassword, (user as any)._passwordHash || '');
      if (!isCurrentPasswordValid) {
        return ResponseUtil.error(res, 'Contraseña actual incorrecta', HttpStatus.BAD_REQUEST);
      }

      // Encriptar nueva contraseña
      const newPasswordHash = await AuthUtils.hashPassword(newPassword);
      
      // Cambiar contraseña usando método específico si está disponible
      if ('changePassword' in this.userRepository) {
        const success = await (this.userRepository as any).changePassword(user.id, newPasswordHash);
        if (!success) {
          throw new Error('No se pudo actualizar la contraseña');
        }
      } else {
        // Actualizar manualmente
        (user as any)._passwordHash = newPasswordHash;
        await this.userRepository.update(user);
      }

      console.log('🔐 Contraseña cambiada:', {
        userId: user.id,
        email: user.email.value,
        timestamp: new Date().toISOString()
      });

      return ResponseUtil.success(res, null, 'Contraseña cambiada exitosamente');

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al cambiar contraseña';
      return ResponseUtil.error(res, message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  };

  /**
   * Obtener estadísticas de usuarios (solo admins)
   */
  getUserStats = async (req: Request, res: Response): Promise<Response> => {
    try {
      if (!req.user || req.user.role !== UserRole.ADMIN) {
        return ResponseUtil.error(res, 'Acceso denegado. Solo administradores', HttpStatus.FORBIDDEN);
      }

      let stats;
      
      // Usar método específico si está disponible
      if ('getUserStats' in this.userRepository) {
        stats = await (this.userRepository as any).getUserStats();
      } else {
        // Calcular estadísticas básicas
        const totalUsers = await this.userRepository.count();
        const activeUsers = await this.userRepository.countByStatus(UserStatus.ACTIVE);
        
        stats = {
          totalUsers,
          activeUsers,
          adminUsers: 'N/A',
          moderatorUsers: 'N/A',
          regularUsers: 'N/A',
          verifiedUsers: 'N/A'
        };
      }

      return ResponseUtil.success(res, {
        ...stats,
        repository: this.userRepository.constructor.name,
        timestamp: new Date().toISOString()
      }, 'Estadísticas de usuarios obtenidas');

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al obtener estadísticas';
      return ResponseUtil.error(res, message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  };

  /**
   * Listar usuarios con paginación (solo admins y moderadores)
   */
  getUsers = async (req: Request, res: Response): Promise<Response> => {
    try {
      if (!req.user || ![UserRole.ADMIN, UserRole.MODERATOR].includes(req.user.role)) {
        return ResponseUtil.error(res, 'Acceso denegado', HttpStatus.FORBIDDEN);
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      const role = req.query.role as UserRole;
      const status = req.query.status as UserStatus;

      let result;

      // Usar paginación avanzada si está disponible
      if ('findWithPagination' in this.userRepository) {
        result = await (this.userRepository as any).findWithPagination(page, limit, {
          role,
          status,
          search
        });
      } else {
        // Paginación básica
        const offset = (page - 1) * limit;
        const users = await this.userRepository.findAll(limit, offset);
        const total = await this.userRepository.count();
        
        result = {
          users,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        };
      }

      // Formatear usuarios para respuesta
      const formattedUsers = result.users.map((user: User) => ({
        id: user.id,
        email: user.email.value,
        name: user.displayName,
        role: user.role,
        status: user.status,
        isEmailVerified: user.isEmailVerified,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt
      }));

      return ResponseUtil.success(res, {
        users: formattedUsers,
        pagination: result.pagination,
        repository: this.userRepository.constructor.name
      }, 'Usuarios obtenidos exitosamente');

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al obtener usuarios';
      return ResponseUtil.error(res, message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  };

  /**
   * Obtener permisos de usuario según rol
   */
  private getUserPermissions(role: UserRole): string[] {
    switch (role) {
      case UserRole.ADMIN:
        return ['ALL_PERMISSIONS'];
      case UserRole.MODERATOR:
        return ['read', 'create', 'update', 'moderate', 'ban_users'];
      case UserRole.USER:
        return ['read', 'create', 'update_own'];
      case UserRole.GUEST:
        return ['read'];
      default:
        return [];
    }
  }

  /**
   * Health check de la base de datos
   */
  healthCheck = async (req: Request, res: Response): Promise<Response> => {
    try {
      const isHealthy = await container.healthCheck();
      const stats = container.getConnectionStats();

      return ResponseUtil.success(res, {
        ...stats,
        database: isHealthy ? 'healthy' : 'unhealthy'
      }, 'Health check completado');

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error en health check';
      return ResponseUtil.error(res, message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  };

  /**
   * Reiniciar el contenedor DI (solo admins en desarrollo)
   */
  restartContainer = async (req: Request, res: Response): Promise<Response> => {
    try {
      if (!req.user || req.user.role !== UserRole.ADMIN) {
        return ResponseUtil.error(res, 'Acceso denegado. Solo administradores', HttpStatus.FORBIDDEN);
      }

      if (process.env.NODE_ENV === 'production') {
        return ResponseUtil.error(res, 'Operación no permitida en producción', HttpStatus.FORBIDDEN);
      }

      await container.restart();
      const stats = container.getConnectionStats();

      return ResponseUtil.success(res, stats, 'Contenedor DI reiniciado exitosamente');

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al reiniciar contenedor';
      return ResponseUtil.error(res, message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  };
}
