import { Router } from 'express';
import appRoutes from './appRoutes';
import userRoutes from './userRoutes';
import authRoutes from './authRoutes';
import databaseAuthRoutes from './databaseAuthRoutes';
import protectedRoutes from './protectedRoutes';

const router = Router();

// Rutas principales
router.use('/', appRoutes);

// Rutas de autenticación
router.use('/auth', authRoutes);

// Rutas de autenticación con inyección de dependencias (BD)
router.use('/db', databaseAuthRoutes);

// Rutas del dominio de usuarios (ahora protegidas)
router.use('/users', userRoutes);

// Rutas protegidas con control de acceso avanzado
router.use('/protected', protectedRoutes);

export default router;
