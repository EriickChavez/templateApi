import express from 'express';
import cors from 'cors';
import { config } from './config/env';

const app = express();
const PORT = 3001;

// Middlewares básicos
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de logging simple
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Rutas de prueba simples
app.get('/', (req, res) => {
  res.json({ 
    success: true, 
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    status: 'healthy',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

app.get('/simple-test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Simple endpoint working',
    timestamp: new Date().toISOString()
  });
});

// Rutas de autenticación simplificadas
app.post('/auth/register', (req, res) => {
  const { email, password, firstName, lastName } = req.body;
  
  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({
      success: false,
      error: 'Todos los campos son requeridos'
    });
  }
  
  // Simulación de registro exitoso
  res.status(201).json({
    success: true,
    message: 'Usuario registrado exitosamente',
    user: {
      id: '123',
      email,
      name: `${firstName} ${lastName}`,
      role: 'admin'
    },
    token: 'fake-jwt-token'
  });
});

app.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Email y password son requeridos'
    });
  }
  
  // Simulación de login exitoso
  res.json({
    success: true,
    message: 'Login exitoso',
    user: {
      id: '123',
      email,
      name: 'Usuario Test',
      role: 'admin'
    },
    token: 'fake-jwt-token'
  });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Ruta ${req.originalUrl} no encontrada`
  });
});

// Manejo de errores simple
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Error interno del servidor'
  });
});

// Iniciar servidor
const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor simple corriendo en http://localhost:${PORT}`);
  console.log(`🌍 Entorno: ${config.NODE_ENV}`);
  console.log('✅ API lista para recibir peticiones');
});

// Manejo de cierre graceful simplificado
process.on('SIGTERM', () => {
  console.log('🔄 Cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🔄 Cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado');
    process.exit(0);
  });
});

export default app;
