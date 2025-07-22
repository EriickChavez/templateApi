import express from 'express';
import cors from 'cors';
import { config } from './config/env';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
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

// Manejo global de errores
app.use(errorHandler);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`🌍 Entorno: ${config.NODE_ENV}`);
  console.log(`📦 Versión: ${config.API_VERSION}`);
  console.log(`📝 Endpoints disponibles:`);
  console.log(`   GET / - Hola Mundo`);
  console.log(`   GET /saludo/:nombre - Saludo personalizado`);
  console.log(`   GET /health - Estado de la API`);
  console.log(`   GET /config - Configuración (solo desarrollo)`);
});

export default app;
