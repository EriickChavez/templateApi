import { Request, Response, NextFunction } from 'express';
import { AuthUtils, TokenPayload } from '../utils/auth';
import { ResponseUtil } from '../utils/response';
import { HttpStatus } from '../types';
import { UserRole } from '../domain/entities/User';

// Extender Request para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload & {
        role: UserRole;
      };
    }
  }
}

/**
 * Middleware para verificar JWT token
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    const token = AuthUtils.extractTokenFromHeader(authHeader);
    
    const decoded = AuthUtils.verifyToken(token);
    req.user = decoded;
    
    next();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error de autenticación';
    ResponseUtil.unauthorized(res, message);
  }
};

/**
 * Middleware opcional de autenticación (no falla si no hay token)
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader) {
      const token = AuthUtils.extractTokenFromHeader(authHeader);
      const decoded = AuthUtils.verifyToken(token);
      req.user = decoded;
    }
    
    next();
  } catch (error) {
    // En auth opcional, continuamos sin usuario
    next();
  }
};

/**
 * Middleware para verificar roles específicos
 */
export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      ResponseUtil.unauthorized(res, 'Token de autenticación requerido');
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      ResponseUtil.error(
        res,
        `Acceso denegado. Roles permitidos: ${allowedRoles.join(', ')}`,
        HttpStatus.FORBIDDEN
      );
      return;
    }

    next();
  };
};

/**
 * Middleware que requiere ser administrador
 */
export const requireAdmin = requireRole(UserRole.ADMIN);

/**
 * Middleware que requiere ser administrador o moderador
 */
export const requireAdminOrModerator = requireRole(UserRole.ADMIN, UserRole.MODERATOR);

/**
 * Middleware que permite cualquier usuario autenticado
 */
export const requireAuth = requireRole(UserRole.ADMIN, UserRole.MODERATOR, UserRole.USER, UserRole.GUEST);

/**
 * Middleware para verificar que el usuario sea propietario del recurso o admin
 */
export const requireOwnership = (userIdParam: string = 'id') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      ResponseUtil.unauthorized(res, 'Token de autenticación requerido');
      return;
    }

    const resourceUserId = req.params[userIdParam];
    const currentUserId = req.user.userId;

    // Admin puede acceder a cualquier recurso
    if (req.user.role === UserRole.ADMIN) {
      next();
      return;
    }

    if (resourceUserId !== currentUserId) {
      ResponseUtil.error(
        res,
        'Solo puedes acceder a tus propios recursos',
        HttpStatus.FORBIDDEN
      );
      return;
    }

    next();
  };
};

/**
 * Middleware para validar API Key (alternativa a JWT para servicios)
 */
export const validateApiKey = (req: Request, res: Response, next: NextFunction): void => {
  const apiKey = req.headers['x-api-key'] as string;
  
  if (!apiKey) {
    ResponseUtil.unauthorized(res, 'API Key requerida');
    return;
  }

  // En un caso real, validarías contra una base de datos
  const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];
  
  if (!validApiKeys.includes(apiKey)) {
    ResponseUtil.unauthorized(res, 'API Key inválida');
    return;
  }

  next();
};

/**
 * Middleware para verificar si el usuario está activo
 */
export const requireActiveUser = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    ResponseUtil.unauthorized(res, 'Token de autenticación requerido');
    return;
  }

  // En un caso real, verificarías el estado en la base de datos
  // const user = await UserRepository.findById(req.user.userId);
  // if (!user || !user.isActive) { ... }

  next();
};

/**
 * Middleware para logging de acciones de autenticación
 */
export const logAuthAttempt = (req: Request, res: Response, next: NextFunction): void => {
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent');
  const timestamp = new Date().toISOString();

  console.log(`🔐 Intento de autenticación: ${timestamp}`, {
    ip,
    userAgent,
    path: req.path,
    method: req.method
  });

  next();
};
