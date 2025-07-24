import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { 
  authenticateToken, 
  requireRole, 
  requireAdmin, 
  requireAdminOrModerator,
  requireAuth,
  optionalAuth,
  logAuthAttempt 
} from '../middlewares/auth';
import { UserRole } from '../domain/entities/User';

const router = Router();
const authController = new AuthController();

// ===== RUTAS PÚBLICAS (sin autenticación) =====

/**
 * POST /auth/register
 * Registro de nuevos usuarios
 */
router.post('/register', logAuthAttempt, authController.register);

/**
 * POST /auth/login  
 * Login de usuarios
 */
router.post('/login', logAuthAttempt, authController.login);

// ===== RUTAS PROTEGIDAS (requieren autenticación) =====

/**
 * GET /auth/me
 * Obtener información del usuario actual
 * Requiere: Usuario autenticado (cualquier rol)
 */
router.get('/me', authenticateToken, authController.me);

/**
 * POST /auth/refresh
 * Renovar token de acceso
 * Requiere: Usuario autenticado (cualquier rol)
 */
router.post('/refresh', authenticateToken, authController.refresh);

/**
 * POST /auth/logout
 * Cerrar sesión
 * Requiere: Usuario autenticado (cualquier rol)
 */
router.post('/logout', authenticateToken, authController.logout);

/**
 * PUT /auth/change-password
 * Cambiar contraseña del usuario actual
 * Requiere: Usuario autenticado (cualquier rol)
 */
router.put('/change-password', authenticateToken, authController.changePassword);

/**
 * PUT /auth/change-role
 * Cambiar rol de usuario (solo para desarrollo inicial)
 * ⚠️  USAR SOLO PARA CREAR ADMINS INICIALES
 */
router.put('/change-role', authController.changeUserRole);

// ===== RUTAS DE EJEMPLO POR ROLES =====

/**
 * GET /auth/admin-only
 * Endpoint solo para administradores
 * Requiere: Rol ADMIN
 */
router.get('/admin-only', authenticateToken, requireAdmin, (req, res) => {
  res.json({
    success: true,
    message: '🔐 Esta es una ruta solo para administradores',
    data: {
      user: req.user,
      secretData: 'Información super secreta solo para admins'
    }
  });
});

/**
 * GET /auth/moderator-area
 * Endpoint para administradores y moderadores
 * Requiere: Rol ADMIN o MODERATOR
 */
router.get('/moderator-area', authenticateToken, requireAdminOrModerator, (req, res) => {
  res.json({
    success: true,
    message: '👮‍♂️ Esta es una ruta para administradores y moderadores',
    data: {
      user: req.user,
      moderationTools: ['ban_user', 'delete_content', 'edit_posts']
    }
  });
});

/**
 * GET /auth/user-area
 * Endpoint para usuarios normales (excluye guests)
 * Requiere: Rol USER, MODERATOR o ADMIN
 */
router.get('/user-area', authenticateToken, requireRole(UserRole.USER, UserRole.MODERATOR, UserRole.ADMIN), (req, res) => {
  res.json({
    success: true,
    message: '👤 Esta es una ruta para usuarios registrados',
    data: {
      user: req.user,
      userFeatures: ['create_posts', 'comment', 'like', 'share']
    }
  });
});

/**
 * GET /auth/guest-allowed
 * Endpoint que permite cualquier usuario autenticado (incluso guests)
 * Requiere: Cualquier usuario autenticado
 */
router.get('/guest-allowed', authenticateToken, requireAuth, (req, res) => {
  res.json({
    success: true,
    message: '🚪 Esta ruta permite cualquier usuario autenticado',
    data: {
      user: req.user,
      publicFeatures: ['view_content', 'search']
    }
  });
});

/**
 * GET /auth/public-with-optional-user
 * Endpoint público pero que puede mostrar información adicional si está autenticado
 * Requiere: Ninguna (opcional autenticación)
 */
router.get('/public-with-optional-user', optionalAuth, (req, res) => {
  const baseResponse = {
    success: true,
    message: '🌍 Esta es una ruta pública',
    data: {
      publicContent: 'Contenido disponible para todos'
    }
  };

  if (req.user) {
    (baseResponse.data as any).user = req.user;
    (baseResponse.data as any).personalizedContent = 'Contenido personalizado porque estás autenticado';
    baseResponse.message = '🌍 Esta es una ruta pública (con usuario autenticado)';
  }

  res.json(baseResponse);
});

// ===== RUTAS DE DEMOSTRACIÓN DE ROLES =====

/**
 * GET /auth/role-demo
 * Endpoint que muestra diferentes respuestas según el rol
 * Requiere: Usuario autenticado (cualquier rol)
 */
router.get('/role-demo', authenticateToken, (req, res) => {
  const user = req.user!;
  let roleSpecificData;

  switch (user.role) {
    case UserRole.ADMIN:
      roleSpecificData = {
        role: 'Administrador',
        permissions: ['ALL'],
        dashboardUrl: '/admin/dashboard',
        specialMessage: '👑 Tienes acceso completo al sistema'
      };
      break;
    
    case UserRole.MODERATOR:
      roleSpecificData = {
        role: 'Moderador',
        permissions: ['moderate', 'ban', 'edit'],
        dashboardUrl: '/moderator/dashboard',
        specialMessage: '👮‍♂️ Puedes moderar contenido y usuarios'
      };
      break;
    
    case UserRole.USER:
      roleSpecificData = {
        role: 'Usuario',
        permissions: ['create', 'edit_own', 'comment'],
        dashboardUrl: '/user/profile',
        specialMessage: '👤 Puedes crear y editar tu propio contenido'
      };
      break;
    
    case UserRole.GUEST:
      roleSpecificData = {
        role: 'Invitado',
        permissions: ['read'],
        dashboardUrl: '/guest/welcome',
        specialMessage: '🚪 Tienes acceso limitado de solo lectura'
      };
      break;
    
    default:
      roleSpecificData = {
        role: 'Desconocido',
        permissions: [],
        dashboardUrl: '/',
        specialMessage: '❓ Rol no reconocido'
      };
  }

  res.json({
    success: true,
    message: `Bienvenido ${user.email}`,
    data: {
      user: {
        id: user.userId,
        email: user.email,
        role: user.role
      },
      ...roleSpecificData
    }
  });
});

export default router;
