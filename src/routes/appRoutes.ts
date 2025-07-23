import { Router } from 'express';
import { AppController } from '../controllers/AppController';
import { validateName } from '../middlewares/validators';

const router = Router();
const appController = new AppController();

/**
 * @route   GET /
 * @desc    Información básica de la aplicación
 * @access  Public
 */
router.get('/', appController.getAppInfo);

/**
 * @route   GET /saludo/:nombre
 * @desc    Obtener saludo personalizado
 * @access  Public
 */
router.get('/saludo/:nombre', validateName, appController.getPersonalizedGreeting);

/**
 * @route   GET /health
 * @desc    Estado de salud de la API
 * @access  Public
 */
router.get('/health', appController.getHealthStatus);

/**
 * @route   GET /config
 * @desc    Configuración actual (solo desarrollo)
 * @access  Public
 */
router.get('/config', appController.getConfigInfo);

/**
 * @route   POST /test-error
 * @desc    Endpoint para probar diferentes tipos de errores
 * @access  Public (solo para testing)
 */
router.post('/test-error', appController.testError);

export default router;
