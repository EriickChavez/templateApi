import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../domain/entities/User';
import { ResponseUtil } from '../utils/response';
import { HttpStatus } from '../types';

// Definición de permisos del sistema
export enum Permission {
  // Usuarios
  CREATE_USER = 'create_user',
  READ_USER = 'read_user',
  UPDATE_USER = 'update_user',
  DELETE_USER = 'delete_user',
  MANAGE_USER_ROLES = 'manage_user_roles',
  
  // Contenido
  CREATE_CONTENT = 'create_content',
  READ_CONTENT = 'read_content',
  UPDATE_CONTENT = 'update_content',
  DELETE_CONTENT = 'delete_content',
  MODERATE_CONTENT = 'moderate_content',
  
  // Sistema
  VIEW_ANALYTICS = 'view_analytics',
  MANAGE_SYSTEM = 'manage_system',
  ACCESS_ADMIN_PANEL = 'access_admin_panel',
  
  // Moderación
  BAN_USERS = 'ban_users',
  DELETE_COMMENTS = 'delete_comments',
  EDIT_ANY_CONTENT = 'edit_any_content',
}

// Mapa de roles y sus permisos
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    // Admin tiene todos los permisos
    ...Object.values(Permission)
  ],
  
  [UserRole.MODERATOR]: [
    Permission.READ_USER,
    Permission.UPDATE_USER,
    Permission.CREATE_CONTENT,
    Permission.READ_CONTENT,
    Permission.UPDATE_CONTENT,
    Permission.DELETE_CONTENT,
    Permission.MODERATE_CONTENT,
    Permission.BAN_USERS,
    Permission.DELETE_COMMENTS,
    Permission.EDIT_ANY_CONTENT,
    Permission.VIEW_ANALYTICS,
  ],
  
  [UserRole.USER]: [
    Permission.READ_USER,
    Permission.CREATE_CONTENT,
    Permission.READ_CONTENT,
    Permission.UPDATE_CONTENT, // Solo su propio contenido
  ],
  
  [UserRole.GUEST]: [
    Permission.READ_CONTENT,
  ],
};

/**
 * Verifica si un rol tiene un permiso específico
 */
export const hasPermission = (role: UserRole, permission: Permission): boolean => {
  return ROLE_PERMISSIONS[role]?.includes(permission) || false;
};

/**
 * Middleware que requiere permisos específicos
 */
export const requirePermissions = (...permissions: Permission[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      ResponseUtil.unauthorized(res, 'Token de autenticación requerido');
      return;
    }

    const userRole = req.user.role;
    const missingPermissions: Permission[] = [];

    for (const permission of permissions) {
      if (!hasPermission(userRole, permission)) {
        missingPermissions.push(permission);
      }
    }

    if (missingPermissions.length > 0) {
      ResponseUtil.error(
        res,
        `Acceso denegado. Permisos requeridos: ${missingPermissions.join(', ')}`,
        HttpStatus.FORBIDDEN
      );
      return;
    }

    next();
  };
};

/**
 * Middleware que verifica múltiples condiciones de acceso
 */
export interface AccessCondition {
  roles?: UserRole[];
  permissions?: Permission[];
  requireOwnership?: boolean;
  resourceOwnerField?: string; // Campo en params que contiene el ID del propietario
  customValidator?: (req: Request) => boolean;
}

export const requireAccess = (condition: AccessCondition) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      ResponseUtil.unauthorized(res, 'Token de autenticación requerido');
      return;
    }

    const user = req.user;
    
    // Verificar roles si se especifican
    if (condition.roles && !condition.roles.includes(user.role)) {
      ResponseUtil.error(
        res,
        `Acceso denegado. Roles permitidos: ${condition.roles.join(', ')}`,
        HttpStatus.FORBIDDEN
      );
      return;
    }

    // Verificar permisos si se especifican
    if (condition.permissions) {
      const missingPermissions = condition.permissions.filter(
        permission => !hasPermission(user.role, permission)
      );

      if (missingPermissions.length > 0) {
        ResponseUtil.error(
          res,
          `Acceso denegado. Permisos requeridos: ${missingPermissions.join(', ')}`,
          HttpStatus.FORBIDDEN
        );
        return;
      }
    }

    // Verificar propiedad del recurso
    if (condition.requireOwnership && user.role !== UserRole.ADMIN) {
      const ownerField = condition.resourceOwnerField || 'userId';
      const resourceOwnerId = req.params[ownerField] || req.body[ownerField];

      if (resourceOwnerId !== user.userId) {
        ResponseUtil.error(
          res,
          'Solo puedes acceder a tus propios recursos',
          HttpStatus.FORBIDDEN
        );
        return;
      }
    }

    // Validador personalizado
    if (condition.customValidator && !condition.customValidator(req)) {
      ResponseUtil.error(
        res,
        'Acceso denegado por validación personalizada',
        HttpStatus.FORBIDDEN
      );
      return;
    }

    next();
  };
};

/**
 * Middleware que aplica diferentes reglas según el método HTTP
 */
export const requireMethodBasedAccess = (rules: Record<string, AccessCondition>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const method = req.method.toUpperCase();
    const rule = rules[method];

    if (!rule) {
      ResponseUtil.error(
        res,
        `Método ${method} no permitido en este endpoint`,
        HttpStatus.METHOD_NOT_ALLOWED
      );
      return;
    }

    requireAccess(rule)(req, res, next);
  };
};

/**
 * Helpers para condiciones comunes
 */
export const AccessRules = {
  adminOnly: (): AccessCondition => ({
    roles: [UserRole.ADMIN]
  }),

  adminOrModerator: (): AccessCondition => ({
    roles: [UserRole.ADMIN, UserRole.MODERATOR]
  }),

  authenticatedUsers: (): AccessCondition => ({
    roles: [UserRole.ADMIN, UserRole.MODERATOR, UserRole.USER]
  }),

  ownResourceOrAdmin: (resourceOwnerField = 'userId'): AccessCondition => ({
    requireOwnership: true,
    resourceOwnerField
  }),

  contentManagement: (): AccessCondition => ({
    permissions: [Permission.CREATE_CONTENT, Permission.UPDATE_CONTENT]
  }),

  userManagement: (): AccessCondition => ({
    permissions: [Permission.CREATE_USER, Permission.UPDATE_USER, Permission.DELETE_USER]
  }),

  moderation: (): AccessCondition => ({
    permissions: [Permission.MODERATE_CONTENT, Permission.BAN_USERS]
  }),
};

/**
 * Middleware para logging de accesos
 */
export const logAccess = (req: Request, res: Response, next: NextFunction): void => {
  const user = req.user;
  const timestamp = new Date().toISOString();
  const ip = req.ip || req.connection.remoteAddress;

  console.log(`🔒 Control de acceso: ${timestamp}`, {
    userId: user?.userId,
    email: user?.email,
    role: user?.role,
    method: req.method,
    path: req.path,
    ip,
    userAgent: req.get('User-Agent')
  });

  next();
};
