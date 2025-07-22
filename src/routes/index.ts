import { Router } from 'express';
import appRoutes from './appRoutes';

const router = Router();

// Rutas principales
router.use('/', appRoutes);

// Ruta de ejemplo para futuras funcionalidades
// router.use('/api/v1/users', userRoutes);
// router.use('/api/v1/auth', authRoutes);

export default router;
