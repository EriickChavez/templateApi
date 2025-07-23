import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { UserDomainService } from '../domain/services/UserDomainService';
import { InMemoryUserRepository } from '../infrastructure/repositories/InMemoryUserRepository';

const router = Router();

// Instanciar dependencias
const userRepository = new InMemoryUserRepository();
const userDomainService = new UserDomainService(userRepository);
const userController = new UserController(userDomainService);

/**
 * @route   POST /users
 * @desc    Crear un nuevo usuario
 * @access  Public (en producción sería Private/Admin)
 */
router.post('/', userController.createUser);

/**
 * @route   POST /users/demo
 * @desc    Crear usuarios de demostración
 * @access  Public (solo para testing)
 */
router.post('/demo', userController.createDemoUsers);

/**
 * @route   GET /users/stats
 * @desc    Obtener estadísticas de usuarios
 * @access  Public (en producción sería Private/Admin)
 */
router.get('/stats', userController.getUserStats);

/**
 * @route   GET /users
 * @desc    Buscar usuarios con filtros
 * @access  Public (en producción sería Private)
 */
router.get('/', userController.searchUsers);

/**
 * @route   GET /users/:id
 * @desc    Obtener un usuario por ID
 * @access  Public (en producción sería Private)
 */
router.get('/:id', userController.getUserById);

/**
 * @route   PUT /users/:id/email
 * @desc    Actualizar email de usuario
 * @access  Public (en producción sería Private/Own)
 */
router.put('/:id/email', userController.updateUserEmail);

/**
 * @route   PUT /users/:id/role
 * @desc    Cambiar rol de usuario
 * @access  Public (en producción sería Private/Admin)
 */
router.put('/:id/role', userController.changeUserRole);

/**
 * @route   PUT /users/:id/toggle-status
 * @desc    Activar/desactivar usuario
 * @access  Public (en producción sería Private/Admin)
 */
router.put('/:id/toggle-status', userController.toggleUserStatus);

/**
 * @route   GET /users/:id/permissions/:action
 * @desc    Verificar permisos de usuario
 * @access  Public (en producción sería Private)
 */
router.get('/:id/permissions/:action', userController.checkUserPermissions);

export default router;
