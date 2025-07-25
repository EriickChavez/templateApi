import { Router } from 'express';
import { versionInfoEndpoint } from '../middlewares/versioning';

const router = Router();

// GET /version - Información de versiones de API
router.get('/', versionInfoEndpoint);

export default router;
