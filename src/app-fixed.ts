import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import { config } from './config/env';
import routes from './routes';
import { errorHandler, notFoundHandler, initErrorSystem, globalErrorCatcher } from './middlewares/errorHandler';
import { container } from './infrastructure/di/Container';

const app = express();
const PORT = config.PORT;

// Variable para el servidor
let server: any;

// Función para inicializar el sistema (sin process.exit agresivo)
const initializeSystem = async () => {
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
    throw error; // Lanzar error en lugar de process.exit
  }
};

// Trust proxy
app.set('trust proxy', 1);

// Middlewares básicos y seguros
app.use(cors({
  origin: config.NODE_ENV === 'development' ? true : config.CORS_ORIGIN.split(','),
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de logging simple
app.use((req, res, next) => {
  console.log(`📥 ${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Rutas
app.use('/', routes);

// Manejo de rutas no encontradas
app.use(notFoundHandler);

// Manejo global de errores
app.use(errorHandler);

// Función para iniciar el servidor
const startServer = async () => {
  try {
    await initializeSystem();
    
    server = app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
      console.log(`🌍 Entorno: ${config.NODE_ENV}`);
      console.log(`📦 Versión: ${config.API_VERSION}`);
      console.log(`🛡️  Sistema de errores: ✅ Activado`);
      console.log(`🔐 Autenticación JWT: ✅ Activado`);
      console.log(`📋 Background Jobs: ${config.DATABASE_URL ? '✅ Activado' : '⚠️ Desactivado (sin DB)'}`);
      
      console.log(`\n📝 Endpoints principales:`);
      console.log(`   GET  / - Hola Mundo`);
      console.log(`   GET  /health - Estado de la API`);
      console.log(`   POST /auth/register - Registro de usuarios`);
      console.log(`   POST /auth/login - Login`);
      console.log(`   GET  /auth/me - Info del usuario actual`);
    });
    
    return server;
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

// Manejo de cierre graceful
const gracefulShutdown = async (signal: string) => {
  console.log(`\n🔄 Recibida señal ${signal}. Cerrando servidor gracefully...`);

  if (server) {
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
  } else {
    process.exit(0);
  }
};

// Registrar manejadores de señales
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Manejo de errores no capturados (menos agresivo)
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  if (config.NODE_ENV === 'production') {
    gracefulShutdown('uncaughtException');
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  if (config.NODE_ENV === 'production') {
    gracefulShutdown('unhandledRejection');
  }
});

// Iniciar la aplicación
startServer();

export default app;
