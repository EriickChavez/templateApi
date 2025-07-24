import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { UserDomainService } from '../domain/services/UserDomainService';
import { InMemoryUserRepository } from '../infrastructure/repositories/InMemoryUserRepository';
import { 
  authenticateToken, 
  requireAdmin, 
  requireAdminOrModerator,
  requireOwnership,
  optionalAuth 
} from '../middlewares/auth';

const router = Router();

// Instanciar dependencias
const userRepository = new InMemoryUserRepository();
const userDomainService = new UserDomainService(userRepository);
const userController = new UserController(userDomainService);

// ===== RUTAS PÚBLICAS =====

/**
 * @route   POST /users/demo
 * @desc    Crear usuarios de demostración
 * @access  Public (solo para testing/desarrollo)
 */
router.post('/demo', userController.createDemoUsers);

/**
 * @route   GET /users/stats
 * @desc    Obtener estadísticas públicas de usuarios
 * @access  Public (información básica)
 */
router.get('/stats', optionalAuth, userController.getUserStats);

// ===== RUTAS QUE REQUIEREN AUTENTICACIÓN =====

/**
 * @route   POST /users
 * @desc    Crear un nuevo usuario
 * @access  Private - Solo ADMIN
 */
router.post('/', authenticateToken, requireAdmin, userController.createUser);

/**
 * @route   GET /users
 * @desc    Buscar usuarios con filtros
 * @access  Private - ADMIN y MODERATOR pueden ver lista completa
 */
router.get('/', authenticateToken, requireAdminOrModerator, userController.searchUsers);

/**
 * @route   GET /users/:id
 * @desc    Obtener un usuario por ID
 * @access  Private - Solo el propio usuario o ADMIN
 */
router.get('/:id', authenticateToken, requireOwnership('id'), userController.getUserById);

/**
 * @route   PUT /users/:id/email
 * @desc    Actualizar email de usuario
 * @access  Private - Solo el propio usuario o ADMIN
 */
router.put('/:id/email', authenticateToken, requireOwnership('id'), userController.updateUserEmail);

/**
 * @route   PUT /users/:id/role
 * @desc    Cambiar rol de usuario
 * @access  Private - Solo ADMIN
 */
router.put('/:id/role', authenticateToken, requireAdmin, userController.changeUserRole);

/**
 * @route   PUT /users/:id/toggle-status
 * @desc    Activar/desactivar usuario
 * @access  Private - Solo ADMIN y MODERADOR
 */
router.put('/:id/toggle-status', authenticateToken, requireAdminOrModerator, userController.toggleUserStatus);

/**
 * @route   GET /users/:id/permissions/:action
 * @desc    Verificar permisos de usuario
 * @access  Private - Solo el propio usuario o ADMIN
 */
router.get('/:id/permissions/:action', authenticateToken, requireOwnership('id'), userController.checkUserPermissions);

export default router;
