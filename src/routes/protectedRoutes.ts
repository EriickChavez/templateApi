import { Router } from 'express';
import { 
  requirePermissions, 
  requireAccess, 
  requireMethodBasedAccess,
  AccessRules,
  Permission,
  logAccess 
} from '../middlewares/roleBasedAccess';
import { authenticateToken } from '../middlewares/auth';
import { UserRole } from '../domain/entities/User';
import { ResponseUtil } from '../utils/response';

const router = Router();

// Aplicar autenticación y logging a todas las rutas
router.use(authenticateToken, logAccess);

// ===== RUTAS DE GESTIÓN DE USUARIOS =====

/**
 * GET /protected/users
 * Listar usuarios - Solo admins y moderadores
 */
router.get('/users', requireAccess(AccessRules.adminOrModerator()), (req, res) => {
  ResponseUtil.success(res, {
    users: [
      { id: '1', email: 'admin@test.com', role: 'admin' },
      { id: '2', email: 'user@test.com', role: 'user' }
    ]
  }, 'Lista de usuarios obtenida');
});

/**
 * POST /protected/users
 * Crear usuario - Solo con permiso CREATE_USER
 */
router.post('/users', requirePermissions(Permission.CREATE_USER), (req, res) => {
  ResponseUtil.success(res, {
    user: { id: '123', ...req.body }
  }, 'Usuario creado exitosamente');
});

/**
 * GET /protected/users/:id
 * Obtener usuario específico - Propio perfil o ser admin
 */
router.get('/users/:id', requireAccess({
  ...AccessRules.ownResourceOrAdmin('id'),
  permissions: [Permission.READ_USER]
}), (req, res) => {
  ResponseUtil.success(res, {
    user: { id: req.params.id, email: 'user@test.com' }
  }, 'Usuario obtenido');
});

/**
 * PUT /protected/users/:id
 * Actualizar usuario - Diferentes reglas según método
 */
router.put('/users/:id', requireMethodBasedAccess({
  'PUT': {
    requireOwnership: true,
    resourceOwnerField: 'id',
    permissions: [Permission.UPDATE_USER]
  }
}), (req, res) => {
  ResponseUtil.success(res, {
    user: { id: req.params.id, ...req.body }
  }, 'Usuario actualizado');
});

/**
 * DELETE /protected/users/:id
 * Eliminar usuario - Solo admins
 */
router.delete('/users/:id', requireAccess(AccessRules.adminOnly()), (req, res) => {
  ResponseUtil.success(res, null, 'Usuario eliminado');
});

// ===== RUTAS DE GESTIÓN DE CONTENIDO =====

/**
 * GET /protected/content
 * Listar contenido - Todos los usuarios autenticados pueden leer
 */
router.get('/content', requirePermissions(Permission.READ_CONTENT), (req, res) => {
  ResponseUtil.success(res, {
    content: [
      { id: '1', title: 'Post 1', author: 'user1' },
      { id: '2', title: 'Post 2', author: 'user2' }
    ]
  }, 'Contenido obtenido');
});

/**
 * POST /protected/content
 * Crear contenido - Usuarios registrados pueden crear
 */
router.post('/content', requireAccess(AccessRules.authenticatedUsers()), (req, res) => {
  ResponseUtil.success(res, {
    content: { id: '123', ...req.body, author: req.user!.userId }
  }, 'Contenido creado');
});

/**
 * PUT /protected/content/:id
 * Actualizar contenido - Solo el autor o moderadores/admins
 */
router.put('/content/:id', requireAccess({
  customValidator: (req) => {
    // Aquí verificarías en la BD si el usuario es el autor del contenido
    // Por ahora simulamos que el content ID coincide con el user ID para demo
    const isAuthor = req.params.id === req.user!.userId;
    const canModerate = [UserRole.ADMIN, UserRole.MODERATOR].includes(req.user!.role);
    return isAuthor || canModerate;
  },
  permissions: [Permission.UPDATE_CONTENT]
}), (req, res) => {
  ResponseUtil.success(res, {
    content: { id: req.params.id, ...req.body }
  }, 'Contenido actualizado');
});

/**
 * DELETE /protected/content/:id
 * Eliminar contenido - Autor, moderadores o admins
 */
router.delete('/content/:id', requireAccess({
  customValidator: (req) => {
    const isAuthor = req.params.id === req.user!.userId;
    const canDelete = [UserRole.ADMIN, UserRole.MODERATOR].includes(req.user!.role);
    return isAuthor || canDelete;
  },
  permissions: [Permission.DELETE_CONTENT]
}), (req, res) => {
  ResponseUtil.success(res, null, 'Contenido eliminado');
});

// ===== RUTAS DE MODERACIÓN =====

/**
 * POST /protected/moderation/ban/:userId
 * Banear usuario - Solo moderadores y admins
 */
router.post('/moderation/ban/:userId', requireAccess(AccessRules.moderation()), (req, res) => {
  ResponseUtil.success(res, {
    bannedUser: req.params.userId,
    bannedBy: req.user!.userId,
    reason: req.body.reason
  }, 'Usuario baneado');
});

/**
 * DELETE /protected/moderation/content/:contentId
 * Eliminar contenido por moderación
 */
router.delete('/moderation/content/:contentId', requirePermissions(Permission.MODERATE_CONTENT), (req, res) => {
  ResponseUtil.success(res, null, 'Contenido eliminado por moderación');
});

// ===== RUTAS ADMINISTRATIVAS =====

/**
 * GET /protected/admin/analytics
 * Ver analytics - Solo admins con permiso específico
 */
router.get('/admin/analytics', requirePermissions(Permission.VIEW_ANALYTICS), (req, res) => {
  ResponseUtil.success(res, {
    users: 1250,
    activeUsers: 890,
    posts: 3400,
    reports: 12
  }, 'Analytics obtenidos');
});

/**
 * GET /protected/admin/system
 * Gestión del sistema - Solo admins
 */
router.get('/admin/system', requirePermissions(Permission.MANAGE_SYSTEM), (req, res) => {
  ResponseUtil.success(res, {
    version: '1.0.0',
    uptime: '5 days',
    memory: '512MB',
    activeConnections: 45
  }, 'Estado del sistema');
});

/**
 * PUT /protected/admin/users/:id/role
 * Cambiar rol de usuario - Solo admins
 */
router.put('/admin/users/:id/role', requirePermissions(Permission.MANAGE_USER_ROLES), (req, res) => {
  const { role } = req.body;
  
  if (!Object.values(UserRole).includes(role)) {
    return ResponseUtil.error(res, 'Rol inválido', 400);
  }

  ResponseUtil.success(res, {
    userId: req.params.id,
    newRole: role,
    changedBy: req.user!.userId
  }, 'Rol de usuario actualizado');
});

// ===== RUTAS MULTI-MÉTODO CON DIFERENTES PERMISOS =====

/**
 * Ruta que maneja diferentes métodos HTTP con reglas específicas
 */
router.route('/resources/:id')
  .all(requireMethodBasedAccess({
    'GET': {
      permissions: [Permission.READ_CONTENT]
    },
    'POST': {
      permissions: [Permission.CREATE_CONTENT],
      roles: [UserRole.USER, UserRole.MODERATOR, UserRole.ADMIN]
    },
    'PUT': {
      requireOwnership: true,
      resourceOwnerField: 'id',
      permissions: [Permission.UPDATE_CONTENT]
    },
    'DELETE': {
      customValidator: (req) => {
        return req.user!.role === UserRole.ADMIN || req.params.id === req.user!.userId;
      },
      permissions: [Permission.DELETE_CONTENT]
    }
  }))
  .get((req, res) => {
    ResponseUtil.success(res, { resource: req.params.id }, 'Recurso obtenido');
  })
  .post((req, res) => {
    ResponseUtil.success(res, { resource: req.params.id, ...req.body }, 'Recurso creado');
  })
  .put((req, res) => {
    ResponseUtil.success(res, { resource: req.params.id, ...req.body }, 'Recurso actualizado');
  })
  .delete((req, res) => {
    ResponseUtil.success(res, null, 'Recurso eliminado');
  });

// ===== RUTA DE DEMOSTRACIÓN DE PERMISOS =====

/**
 * GET /protected/my-permissions
 * Muestra los permisos del usuario actual
 */
router.get('/my-permissions', (req, res) => {
  const user = req.user!;
  const allPermissions = Object.values(Permission);
  const userPermissions = allPermissions.filter(permission => {
    try {
      const { hasPermission } = require('../middlewares/roleBasedAccess');
      return hasPermission(user.role, permission);
    } catch {
      return false;
    }
  });

  ResponseUtil.success(res, {
    user: {
      id: user.userId,
      email: user.email,
      role: user.role
    },
    permissions: userPermissions,
    totalPermissions: allPermissions.length,
    userPermissionsCount: userPermissions.length
  }, 'Permisos del usuario obtenidos');
});

export default router;
