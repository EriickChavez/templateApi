import { Router } from 'express';
import appRoutes from './appRoutes';
import userRoutes from './userRoutes';

const router = Router();

// Rutas principales
router.use('/', appRoutes);

// Rutas del dominio de usuarios
router.use('/users', userRoutes);

// Ruta de ejemplo para futuras funcionalidades
// router.use('/api/v1/auth', authRoutes);

export default router;
