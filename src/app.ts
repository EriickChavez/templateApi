import express from 'express';
import cors from 'cors';
import { config } from './config/env';
import routes from './routes';
import { errorHandler, notFoundHandler, initErrorSystem, globalErrorCatcher } from './middlewares/errorHandler';
import { 
  corsOptions, 
  generalLimiter, 
  helmetConfig, 
  validateContentType, 
  removeUnnecessaryHeaders, 
  securityLogger 
} from './middlewares/security';
import { sanitizeInput } from './middlewares/validators';

const app = express();
const PORT = config.PORT;

// Inicializar sistema de errores
(async () => {
  await initErrorSystem();
  globalErrorCatcher();
})();

// Trust proxy (importante para rate limiting e IP logging)
app.set('trust proxy', 1);

// Middlewares de seguridad (ORDEN IMPORTANTE)
app.use(helmetConfig); // Headers de seguridad
app.use(removeUnnecessaryHeaders); // Remover headers innecesarios
app.use(cors(corsOptions)); // CORS configurado
app.use(generalLimiter); // Rate limiting
app.use(securityLogger); // Logging de seguridad

// Middlewares de parsing
app.use(express.json({ limit: '10mb' })); // Límite de 10MB
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Validación de content-type y sanitización
app.use(validateContentType);
app.use(sanitizeInput);

// Rutas
app.use('/', routes);

// Manejo de rutas no encontradas
app.use(notFoundHandler);

// Manejo global de errores (debe ir al final)
app.use(errorHandler);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`🌍 Entorno: ${config.NODE_ENV}`);
  console.log(`📦 Versión: ${config.API_VERSION}`);
  console.log(`🛡️  Sistema de errores: ✅ Activado`);
  console.log(`🔐 Autenticación JWT: ✅ Activado`);
  console.log(`📂 Logs de errores: ${config.NODE_ENV === 'production' ? '📝 Archivo' : '🖥️  Consola'}`);
  console.log(`\n📝 Endpoints disponibles:`);
  console.log(`\n🌍 RUTAS PÚBLICAS:`);
  console.log(`   GET  / - Hola Mundo`);
  console.log(`   GET  /saludo/:nombre - Saludo personalizado`);
  console.log(`   GET  /health - Estado de la API`);
  console.log(`   GET  /config - Configuración (solo desarrollo)`);
  console.log(`\n🔐 AUTENTICACIÓN:`);
  console.log(`   POST /auth/register - Registro de usuarios`);
  console.log(`   POST /auth/login - Login`);
  console.log(`   GET  /auth/me - Info del usuario actual`);
  console.log(`   POST /auth/refresh - Renovar token`);
  console.log(`   POST /auth/logout - Cerrar sesión`);
  console.log(`\n👥 GESTIÓN DE USUARIOS (Protegidas):`);
  console.log(`   GET  /users - Listar usuarios (Admin/Moderador)`);
  console.log(`   POST /users - Crear usuario (Solo Admin)`);
  console.log(`   GET  /users/:id - Ver usuario (Propio/Admin)`);
  console.log(`   PUT  /users/:id/role - Cambiar rol (Solo Admin)`);
  console.log(`\n🎭 EJEMPLOS DE ROLES:`);
  console.log(`   GET  /auth/admin-only - Solo administradores`);
  console.log(`   GET  /auth/moderator-area - Admins y moderadores`);
  console.log(`   GET  /auth/user-area - Usuarios registrados`);
  console.log(`   GET  /auth/role-demo - Demo de roles`);
  console.log(`\n💡 Usa: Authorization: Bearer <token>`);
});

export default app;
