import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { AuthUtils } from '../utils/auth';
import { ResponseUtil } from '../utils/response';
import { HttpStatus } from '../types';
import { User, UserRole, UserStatus } from '../domain/entities/User';
import { Email } from '../domain/value-objects/Email';
import { PersonName } from '../domain/value-objects/PersonName';
import { InMemoryUserRepository } from '../infrastructure/repositories/InMemoryUserRepository';
import { createError } from '../middlewares/errorHandler';
import { fieldSanitizers, FIELD_CONFIGS, sanitizeObject, SANITIZATION_LEVELS } from '../utils/sanitizer';

export class AuthController extends BaseController {
  private userRepository = new InMemoryUserRepository();

  /**
   * Registro de nuevos usuarios
   */
  register = async (req: Request, res: Response): Promise<Response> => {
    try {
      // Sanitizar datos de entrada usando configuración predefinida
      const rawData = this.validateBody<{
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        middleName?: string;
      }>(req, ['email', 'password', 'firstName', 'lastName']);

      // Aplicar sanitización específica para registro
      const email = fieldSanitizers.email(rawData.email);
      const password = fieldSanitizers.password(rawData.password);
      const firstName = fieldSanitizers.name(rawData.firstName);
      const lastName = fieldSanitizers.name(rawData.lastName);
      const middleName = rawData.middleName ? fieldSanitizers.name(rawData.middleName) : undefined;

      // Validaciones post-sanitización
      if (!email) {
        return ResponseUtil.error(res, 'Email inválido o contiene caracteres peligrosos', HttpStatus.BAD_REQUEST);
      }
      if (!password || password.length < 6) {
        return ResponseUtil.error(res, 'Contraseña debe tener al menos 6 caracteres', HttpStatus.BAD_REQUEST);
      }
      if (!firstName || firstName.trim().length < 2) {
        return ResponseUtil.error(res, 'Nombre debe tener al menos 2 caracteres', HttpStatus.BAD_REQUEST);
      }
      if (!lastName || lastName.trim().length < 2) {
        return ResponseUtil.error(res, 'Apellido debe tener al menos 2 caracteres', HttpStatus.BAD_REQUEST);
      }

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
          timestamp: new Date().toISOString()
        });
      }

      // Guardar usuario
      await this.userRepository.save(user);

      // Generar token
      const token = AuthUtils.generateToken({
        userId: user.id,
        email: user.email.value,
        role: user.role
      });

      return ResponseUtil.success(res, {
        user: {
          id: user.id,
          email: user.email.value,
          name: user.displayName,
          role: user.role,
          status: user.status,
          createdAt: user.createdAt
        },
        token
      }, 'Usuario registrado exitosamente', HttpStatus.CREATED);

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error en el registro';
      return ResponseUtil.error(res, message, HttpStatus.BAD_REQUEST);
    }
  };

  /**
   * Login de usuarios
   */
  login = async (req: Request, res: Response): Promise<Response> => {
    try {
      // Sanitizar datos de entrada
      const rawData = this.validateBody<{
        email: string;
        password: string;
      }>(req, ['email', 'password']);

      // Aplicar sanitización para login
      const email = fieldSanitizers.email(rawData.email);
      const password = fieldSanitizers.password(rawData.password);

      // Validaciones post-sanitización
      if (!email) {
        return ResponseUtil.error(res, 'Email inválido', HttpStatus.BAD_REQUEST);
      }
      if (!password) {
        return ResponseUtil.error(res, 'Contraseña requerida', HttpStatus.BAD_REQUEST);
      }

      // Buscar usuario por email
      const emailVO = new Email(email);
      const user = await this.userRepository.findByEmail(emailVO);

      if (!user) {
        return ResponseUtil.error(res, 'Credenciales inválidas', HttpStatus.UNAUTHORIZED);
      }

      // Verificar si el usuario está activo
      if (!user.isActive()) {
        return ResponseUtil.error(res, 'Cuenta desactivada. Contacte al administrador', HttpStatus.FORBIDDEN);
      }

      // Verificar contraseña (en un caso real, tendrías la contraseña hasheada en el usuario)
      // Por ahora simularemos que funciona
      const isValidPassword = true; // await AuthUtils.comparePassword(password, user.passwordHash);
      
      if (!isValidPassword) {
        return ResponseUtil.error(res, 'Credenciales inválidas', HttpStatus.UNAUTHORIZED);
      }

      // Actualizar último login
      user.updateLastLogin();
      await this.userRepository.update(user);

      // Generar token
      const token = AuthUtils.generateToken({
        userId: user.id,
        email: user.email.value,
        role: user.role
      });

      return ResponseUtil.success(res, {
        user: {
          id: user.id,
          email: user.email.value,
          name: user.displayName,
          role: user.role,
          status: user.status,
          lastLoginAt: user.lastLoginAt,
          isEmailVerified: user.isEmailVerified
        },
        token
      }, 'Login exitoso', HttpStatus.OK);

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error en el login';
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
        role: user.role,
        status: user.status,
        avatar: user.avatar,
        lastLoginAt: user.lastLoginAt,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }, 'Información del usuario obtenida exitosamente');

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al obtener información del usuario';
      return ResponseUtil.error(res, message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  };

  /**
   * Refresh token
   */
  refresh = async (req: Request, res: Response): Promise<Response> => {
    try {
      if (!req.user) {
        return ResponseUtil.error(res, 'Usuario no autenticado', HttpStatus.UNAUTHORIZED);
      }

      // Generar nuevo token
      const newToken = AuthUtils.generateToken({
        userId: req.user.userId,
        email: req.user.email,
        role: req.user.role
      });

      return ResponseUtil.success(res, {
        token: newToken
      }, 'Token renovado exitosamente');

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al renovar token';
      return ResponseUtil.error(res, message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  };

  /**
   * Logout (opcional, principalmente para logging)
   */
  logout = async (req: Request, res: Response): Promise<Response> => {
    try {
      // En JWT stateless, el logout es principalmente del lado del cliente
      // Aquí podríamos hacer logging o limpiar datos de sesión si los hubiera
      
      if (req.user) {
        console.log(`🚪 Usuario ${req.user.email} hizo logout`);
      }

      return ResponseUtil.success(res, null, 'Logout exitoso');

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error en logout';
      return ResponseUtil.error(res, message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  };

  /**
   * Cambiar contraseña
   */
  changePassword = async (req: Request, res: Response): Promise<Response> => {
    try {
      if (!req.user) {
        return ResponseUtil.error(res, 'Usuario no autenticado', HttpStatus.UNAUTHORIZED);
      }

      // Sanitizar datos de entrada
      const rawData = this.validateBody<{
        currentPassword: string;
        newPassword: string;
      }>(req, ['currentPassword', 'newPassword']);

      const currentPassword = fieldSanitizers.password(rawData.currentPassword);
      const newPassword = fieldSanitizers.password(rawData.newPassword);

      // Validaciones post-sanitización
      if (!currentPassword) {
        return ResponseUtil.error(res, 'Contraseña actual requerida', HttpStatus.BAD_REQUEST);
      }
      if (!newPassword || newPassword.length < 6) {
        return ResponseUtil.error(res, 'Nueva contraseña debe tener al menos 6 caracteres', HttpStatus.BAD_REQUEST);
      }

      // Validar nueva contraseña
      const passwordValidation = AuthUtils.validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        return ResponseUtil.error(res, passwordValidation.errors.join(', '), HttpStatus.BAD_REQUEST);
      }

      const user = await this.userRepository.findById(req.user.userId);
      if (!user) {
        return ResponseUtil.error(res, 'Usuario no encontrado', HttpStatus.NOT_FOUND);
      }

      // Verificar contraseña actual (simulado)
      const isCurrentPasswordValid = true; // await AuthUtils.comparePassword(currentPassword, user.passwordHash);
      if (!isCurrentPasswordValid) {
        return ResponseUtil.error(res, 'Contraseña actual incorrecta', HttpStatus.BAD_REQUEST);
      }

      // Encriptar nueva contraseña
      const newPasswordHash = await AuthUtils.hashPassword(newPassword);
      
      // En un sistema real, actualizarías la contraseña del usuario
      // user.updatePassword(newPasswordHash);
      await this.userRepository.update(user);

      return ResponseUtil.success(res, null, 'Contraseña cambiada exitosamente');

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al cambiar contraseña';
      return ResponseUtil.error(res, message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  };

  /**
   * Cambiar rol de usuario (solo para desarrollo o primer admin)
   */
  changeUserRole = async (req: Request, res: Response): Promise<Response> => {
    try {
      // Sanitizar datos de entrada
      const rawData = this.validateBody<{
        email: string;
        newRole: UserRole;
      }>(req, ['email', 'newRole']);

      const email = fieldSanitizers.email(rawData.email);
      const newRole = rawData.newRole; // Los enums no necesitan sanitización, pero sí validación

      // Validaciones post-sanitización
      if (!email) {
        return ResponseUtil.error(res, 'Email inválido', HttpStatus.BAD_REQUEST);
      }

      // Verificar que el rol sea válido
      if (!Object.values(UserRole).includes(newRole)) {
        return ResponseUtil.error(res, 'Rol inválido', HttpStatus.BAD_REQUEST);
      }

      // Buscar usuario por email
      const emailVO = new Email(email);
      const user = await this.userRepository.findByEmail(emailVO);

      if (!user) {
        return ResponseUtil.error(res, 'Usuario no encontrado', HttpStatus.NOT_FOUND);
      }

      // Cambiar rol
      const oldRole = user.role;
      user.changeRole(newRole);
      await this.userRepository.update(user);

      console.log('🔄 CAMBIO DE ROL:', {
        email: user.email.value,
        oldRole,
        newRole,
        timestamp: new Date().toISOString()
      });

      return ResponseUtil.success(res, {
        userId: user.id,
        email: user.email.value,
        oldRole,
        newRole,
        message: `Usuario promovido de ${oldRole} a ${newRole}`
      }, 'Rol cambiado exitosamente');

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al cambiar rol';
      return ResponseUtil.error(res, message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  };
}
