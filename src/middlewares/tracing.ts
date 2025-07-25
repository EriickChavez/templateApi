import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

// Extender el Request para incluir tracing info
declare global {
  namespace Express {
    interface Request {
      correlationId: string;
      requestId: string;
      startTime: number;
      tracing: {
        correlationId: string;
        requestId: string;
        startTime: number;
        userAgent?: string;
        ip: string;
        method: string;
        url: string;
        userId?: string;
        userRole?: string;
      };
    }
  }
}

// Middleware para generar IDs de correlación y request
export const tracingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Generar o usar correlation ID existente (para requests encadenados)
  const correlationId = req.headers['x-correlation-id'] as string || uuidv4();
  const requestId = uuidv4();
  
  // Asignar al request
  req.correlationId = correlationId;
  req.requestId = requestId;
  req.startTime = startTime;
  
  // Crear objeto de tracing completo
  req.tracing = {
    correlationId,
    requestId,
    startTime,
    userAgent: req.headers['user-agent'],
    ip: req.ip || req.connection.remoteAddress || 'unknown',
    method: req.method,
    url: req.originalUrl || req.url,
    userId: (req as any).user?.id,
    userRole: (req as any).user?.role
  };
  
  // Agregar headers de respuesta
  res.setHeader('X-Correlation-ID', correlationId);
  res.setHeader('X-Request-ID', requestId);
  
  // Log de request entrante
  console.log(`[${correlationId}] ${req.method} ${req.url} - Start`, {
    requestId,
    correlationId,
    method: req.method,
    url: req.url,
    ip: req.tracing.ip,
    userAgent: req.tracing.userAgent
  });
  
  // Interceptar el final de la respuesta para logging
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - startTime;
    
    console.log(`[${correlationId}] ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`, {
      requestId,
      correlationId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      ip: req.tracing.ip,
      userId: req.tracing.userId,
      userRole: req.tracing.userRole
    });
    
    return originalSend.call(this, data);
  };
  
  next();
};

// Utility function para obtener tracing info en cualquier parte de la app
export const getTracingInfo = (req: Request) => {
  return {
    ...req.tracing,
    duration: Date.now() - req.startTime
  };
};

// Middleware para actualizar tracing info después de autenticación
export const updateTracingWithUser = (req: Request, res: Response, next: NextFunction) => {
  if ((req as any).user) {
    req.tracing.userId = (req as any).user.id;
    req.tracing.userRole = (req as any).user.role;
  }
  next();
};

// Helper para crear logs estructurados con tracing
export const createTracedLog = (req: Request, level: 'info' | 'warn' | 'error', message: string, meta?: any) => {
  return {
    level,
    message,
    ...req.tracing,
    duration: Date.now() - req.startTime,
    ...meta,
    timestamp: new Date().toISOString()
  };
};
