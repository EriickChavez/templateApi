import { Router } from 'express';
import { AppController } from '../controllers/AppController';
import { validateName } from '../middlewares/validators';

const router = Router();
const appController = new AppController();

/**
 * @swagger
 * /:
 *   get:
 *     summary: Información básica de la aplicación
 *     tags: [App]
 *     responses:
 *       200:
 *         description: Información general
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Hola Mundo desde la API"
 */
router.get('/', appController.getAppInfo);

/**
 * @swagger
 * /saludo/{nombre}:
 *   get:
 *     summary: Obtener saludo personalizado
 *     tags: [App]
 *     parameters:
 *       - name: nombre
 *         in: path
 *         required: true
 *         description: Nombre a saludar
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Devuelve un saludo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Hola, [nombre]!"
 */
router.get('/saludo/:nombre', validateName, appController.getPersonalizedGreeting);

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Estado de salud de la API
 *     tags: [App]
 *     responses:
 *       200:
 *         description: Información de salud de la API
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
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
