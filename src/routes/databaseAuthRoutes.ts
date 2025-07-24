import { Router } from 'express';
import { DatabaseAuthController } from '../controllers/DatabaseAuthController';
import { 
  authenticateToken, 
  requireAdmin, 
  requireAdminOrModerator,
  logAuthAttempt 
} from '../middlewares/auth';

const router = Router();
const databaseAuthController = new DatabaseAuthController();

// ===== RUTAS PÚBLICAS =====

/**
 * POST /db/register
 * Registro con inyección de dependencias
 */
router.post('/register', logAuthAttempt, databaseAuthController.register);

/**
 * POST /db/login
 * Login con inyección de dependencias
 */
router.post('/login', logAuthAttempt, databaseAuthController.login);

// ===== RUTAS PROTEGIDAS =====

/**
 * GET /db/me
 * Información del usuario con inyección de dependencias
 */
router.get('/me', authenticateToken, databaseAuthController.me);

/**
 * POST /db/change-password
 * Cambiar contraseña con inyección de dependencias
 */
router.post('/change-password', authenticateToken, databaseAuthController.changePassword);

/**
 * GET /db/health
 * Health check de la base de datos
 */
router.get('/health', databaseAuthController.healthCheck);

/**
 * GET /db/stats
 * Estadísticas de usuarios (solo admin)
 */
router.get('/stats', authenticateToken, requireAdmin, databaseAuthController.getUserStats);

/**
 * GET /db/users
 * Listar usuarios con paginación (admin/moderador)
 */
router.get('/users', authenticateToken, requireAdminOrModerator, databaseAuthController.getUsers);

// ===== RUTAS DE ADMINISTRACIÓN (Solo desarrollo) =====

/**
 * POST /db/container/restart
 * Reiniciar contenedor DI (solo desarrollo y admin)
 */
router.post('/container/restart', authenticateToken, requireAdmin, databaseAuthController.restartContainer);

export default router;
