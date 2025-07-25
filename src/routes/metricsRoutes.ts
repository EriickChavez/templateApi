import { Router } from 'express';
import { metricsEndpoints } from '../middlewares/performance';
import { authenticateToken } from '../middlewares/auth';
import { requireRole } from '../middlewares/roleBasedAccess';
import { UserRole } from '../dto/UserDto';

const router = Router();

// Todas las rutas de métricas requieren autenticación y rol de admin
router.use(authenticateToken);
router.use(requireRole([UserRole.ADMIN]));

// GET /metrics - Estadísticas generales de performance
router.get('/', metricsEndpoints.getStats);

// GET /metrics/slow - Requests más lentos
router.get('/slow', metricsEndpoints.getSlowRequests);

// GET /metrics/recent - Métricas recientes
router.get('/recent', metricsEndpoints.getRecentMetrics);

// GET /metrics/health - Health check avanzado con métricas
router.get('/health', metricsEndpoints.getHealthWithMetrics);

export default router;
