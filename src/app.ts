import express from 'express';
import { config } from './config/env';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';

const app = express();
const PORT = config.PORT;

// Middlewares globales
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS básico (puedes expandir esto más tarde)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', config.CORS_ORIGIN);
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  next();
});

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
