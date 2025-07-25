import { Router } from 'express';
import appRoutes from './appRoutes';
import userRoutes from './userRoutes';
import authRoutes from './authRoutes';
import databaseAuthRoutes from './databaseAuthRoutes';
import protectedRoutes from './protectedRoutes';
import metricsRoutes from './metricsRoutes';
import jobRoutes from './jobRoutes';
import versionRoutes from './versionRoutes';

const router = Router();

// Rutas principales
router.use('/', appRoutes);

// Información de versiones de API
router.use('/version', versionRoutes);

// Rutas de autenticación
router.use('/auth', authRoutes);

// Rutas de autenticación con inyección de dependencias (BD)
router.use('/db', databaseAuthRoutes);

// Rutas del dominio de usuarios (ahora protegidas)
router.use('/users', userRoutes);

// Rutas protegidas con control de acceso avanzado
router.use('/protected', protectedRoutes);

// Métricas y performance monitoring (Solo Admin)
router.use('/metrics', metricsRoutes);

// Background jobs (Solo Admin)
router.use('/jobs', jobRoutes);

export default router;
