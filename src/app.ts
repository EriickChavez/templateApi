import 'reflect-metadata'; // Debe estar al inicio para class-transformer
import express from 'express';
import cors from 'cors';
import { config } from './config/env';
import routes from './routes';
import { errorHandler, notFoundHandler, initErrorSystem, globalErrorCatcher } from './middlewares/errorHandler';
import { container } from './infrastructure/di/Container';
import {
  corsOptions,
  generalLimiter,
  helmetConfig,
  validateContentType,
  removeUnnecessaryHeaders,
  securityLogger
} from './middlewares/security';
import { swaggerSpec, swaggerUiHandler } from './config/swagger';
import swaggerUi from 'swagger-ui-express';
import { sanitizeInput } from './middlewares/validators';
import { fullSanitizationSuite } from './middlewares/advancedSanitization';
import { tracingMiddleware } from './middlewares/tracing';
import { performanceMiddleware } from './middlewares/performance';
import { versioningMiddleware, versionResponseTransform } from './middlewares/versioning';

const app = express();
const PORT = config.PORT;

// Inicializar sistema de errores y contenedor DI
(async () => {
  try {
    console.log('🔧 Inicializando sistema...');

    // Inicializar sistema de errores
    await initErrorSystem();
    globalErrorCatcher();

    // Inicializar contenedor de inyección de dependencias
    await container.initialize();

    // Inicializar servicio de jobs (solo si hay DATABASE_URL)
    if (config.DATABASE_URL) {
      try {
        const { jobService } = await import('./services/JobService');
        await jobService.initialize();
        console.log('✅ Job Service initialized');
      } catch (error) {
        console.warn('⚠️ Job Service initialization failed (continuing without it):', error);
      }
    } else {
      console.log('ℹ️ Job Service skipped (no DATABASE_URL configured)');
    }

    console.log('✅ Sistema inicializado correctamente');
  } catch (error) {
    console.error('❌ Error al inicializar el sistema:', error);
    process.exit(1);
  }
})();

// Trust proxy (importante para rate limiting e IP logging)
app.set('trust proxy', 1);

// Middlewares de funcionalidades avanzadas (ORDEN IMPORTANTE)
app.use(tracingMiddleware); // Request tracing y correlation IDs
app.use(performanceMiddleware); // Performance monitoring
app.use(versioningMiddleware); // API versioning

// Middlewares de seguridad
app.use(helmetConfig); // Headers de seguridad
app.use(removeUnnecessaryHeaders); // Remover headers innecesarios
app.use(cors(corsOptions)); // CORS configurado
app.use(generalLimiter); // Rate limiting
app.use(securityLogger); // Logging de seguridad

// Middlewares de parsing
app.use(express.json({ limit: '10mb' })); // Límite de 10MB
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Validación de content-type y sanitización avanzada
app.use(validateContentType);
// Aplicar suite completa de sanitización
fullSanitizationSuite.forEach(middleware => app.use(middleware));
// Sanitización básica adicional (mantener por compatibilidad)
app.use(sanitizeInput);

// Middleware para transformar respuestas según versión
app.use(versionResponseTransform);

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUiHandler);

// Rutas
app.use('/', routes);

// Manejo de rutas no encontradas
app.use(notFoundHandler);

// Manejo global de errores (debe ir al final)
app.use(errorHandler);

// Iniciar servidor
const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`🌍 Entorno: ${config.NODE_ENV}`);
  console.log(`📦 Versión: ${config.API_VERSION}`);
  console.log(`🛡️  Sistema de errores: ✅ Activado`);
  console.log(`🔐 Autenticación JWT: ✅ Activado`);
  console.log(`📊 Performance Monitoring: ✅ Activado`);
  console.log(`🔍 Request Tracing: ✅ Activado`);
  console.log(`📋 Background Jobs: ${config.DATABASE_URL ? '✅ Activado' : '⚠️ Desactivado (sin DB)'}`);
  console.log(`🔢 API Versioning: ✅ Activado (v1 por defecto)`);
  console.log(`📝 DTOs y Validación: ✅ Activado`);
  console.log(`📚 Swagger UI: ✅ Disponible en http://localhost:${PORT}/api-docs`);
  console.log(`🧼 Sanitización Avanzada: ✅ Activada (XSS, SQL/NoSQL Injection, Path Traversal)`);
  console.log(`📂 Logs de errores: ${config.NODE_ENV === 'production' ? '📝 Archivo' : '🖥️  Consola'}`);
  console.log(`\n📝 Endpoints disponibles:`);
  console.log(`\n🌍 RUTAS PÚBLICAS:`);
  console.log(`   GET  / - Hola Mundo`);
  console.log(`   GET  /saludo/:nombre - Saludo personalizado`);
  console.log(`   GET  /health - Estado de la API`);
  console.log(`   GET  /config - Configuración (solo desarrollo)`);
  console.log(`   GET  /version - Información de versiones de API`);
  console.log(`\n🔐 AUTENTICACIÓN:`);
  console.log(`   POST /auth/register - Registro de usuarios`);
  console.log(`   POST /auth/login - Login`);
  console.log(`   GET  /auth/me - Info del usuario actual`);
  console.log(`   POST /auth/refresh - Renovar token`);
  console.log(`   POST /auth/logout - Cerrar sesión`);
  console.log(`\n👥 GESTIÓN DE USUARIOS (Protegidas):`);
  console.log(`   GET  /users - Listar usuarios con paginación y filtros`);
  console.log(`   POST /users - Crear usuario (Solo Admin)`);
  console.log(`   GET  /users/:id - Ver usuario (Propio/Admin)`);
  console.log(`   PUT  /users/:id/role - Cambiar rol (Solo Admin)`);
  console.log(`\n📊 MÉTRICAS Y MONITOREO (Solo Admin):`);
  console.log(`   GET  /metrics - Estadísticas de performance`);
  console.log(`   GET  /metrics/slow - Requests más lentos`);
  console.log(`   GET  /metrics/recent - Métricas recientes`);
  console.log(`   GET  /metrics/health - Health check avanzado`);
  console.log(`\n📋 JOBS EN BACKGROUND (Solo Admin):`);
  console.log(`   POST /jobs/schedule - Programar job`);
  console.log(`   GET  /jobs/stats - Estadísticas de jobs`);
  console.log(`   DELETE /jobs/:id - Cancelar job`);
  console.log(`\n🎭 EJEMPLOS DE ROLES:`);
  console.log(`   GET  /auth/admin-only - Solo administradores`);
  console.log(`   GET  /auth/moderator-area - Admins y moderadores`);
  console.log(`   GET  /auth/user-area - Usuarios registrados`);
  console.log(`   GET  /auth/role-demo - Demo de roles`);
  console.log(`\n💡 NOTAS:`);
  console.log(`   - Usa: Authorization: Bearer <token>`);
  console.log(`   - Versionado: Header 'Accept-Version: v1' o URL /v1/endpoint`);
  console.log(`   - Correlación: Header 'X-Correlation-ID' para tracing`);
  console.log(`   - Paginación: ?page=1&limit=10&sortBy=createdAt&sortOrder=desc`);
});

// Manejo de cierre graceful
const gracefulShutdown = async (signal: string) => {
  console.log(`\n🔄 Recibida señal ${signal}. Cerrando servidor gracefully...`);

  // Cerrar servidor HTTP
  server.close(async () => {
    console.log('🔌 Servidor HTTP cerrado');

    try {
      // Limpiar servicio de jobs
      if (config.DATABASE_URL) {
        try {
          const { jobService } = await import('./services/JobService');
          await jobService.shutdown();
          console.log('🔌 Job Service shut down');
        } catch (error) {
          console.warn('⚠️ Job Service cleanup failed:', error);
        }
      }
      
      // Limpiar conexiones de base de datos
      await container.cleanup();
      console.log('✅ Limpieza completada exitosamente');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error durante la limpieza:', error);
      process.exit(1);
    }
  });

  // Forzar cierre después de 10 segundos
  setTimeout(() => {
    console.error('⚠️  Forzando cierre del servidor...');
    process.exit(1);
  }, 10000);
};

// Registrar manejadores de señales
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

export default app;
