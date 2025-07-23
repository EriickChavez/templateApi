import { Request, Response, NextFunction } from 'express';
import { ResponseUtil } from '../utils/response';
import { HttpStatus } from '../types';
import { config } from '../config/env';
import fs from 'fs';
import path from 'path';

export interface CustomError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  code?: string;
  details?: any;
}

// Tipos de errores personalizados
export enum ErrorTypes {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  EXTERNAL_API_ERROR = 'EXTERNAL_API_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}

/**
 * Clase para crear errores personalizados
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code: string;
  public details?: any;

  constructor(message: string, statusCode: number, code: string = 'GENERIC_ERROR', details?: any, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Logger de errores
 */
export class ErrorLogger {
  private static logDir = path.join(process.cwd(), 'logs');
  private static errorLogFile = path.join(ErrorLogger.logDir, 'errors.log');

  static async init() {
    try {
      if (!fs.existsSync(ErrorLogger.logDir)) {
        fs.mkdirSync(ErrorLogger.logDir, { recursive: true });
      }
    } catch (error) {
      console.error('❌ Error creando directorio de logs:', error);
    }
  }

  static async logError(error: CustomError, req?: Request, additionalInfo?: any) {
    const errorLog = {
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      statusCode: error.statusCode,
      code: error.code,
      isOperational: error.isOperational,
      details: error.details,
      request: req ? {
        method: req.method,
        url: req.originalUrl,
        headers: req.headers,
        body: config.NODE_ENV === 'development' ? req.body : '[HIDDEN]',
        params: req.params,
        query: req.query,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      } : undefined,
      additionalInfo
    };

    // Log en consola
    console.error('🚨 ERROR LOGGED:', {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      url: req?.originalUrl,
      method: req?.method,
      timestamp: errorLog.timestamp
    });

    // Log en archivo (solo en producción)
    if (config.NODE_ENV === 'production') {
      try {
        const logEntry = JSON.stringify(errorLog) + '\n';
        fs.appendFileSync(ErrorLogger.errorLogFile, logEntry);
      } catch (logError) {
        console.error('❌ Error escribiendo log:', logError);
      }
    }
  }
}

/**
 * Inicializar el sistema de errores
 */
export const initErrorSystem = async () => {
  await ErrorLogger.init();
};

/**
 * Middleware para manejo de errores global mejorado
 */
export const errorHandler = async (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  let statusCode = err.statusCode || HttpStatus.INTERNAL_SERVER_ERROR;
  let message = err.message || 'Error interno del servidor';
  let errorCode = err.code || 'UNKNOWN_ERROR';

  // Log del error usando el nuevo sistema
  await ErrorLogger.logError(err, req);

  // Manejo específico para diferentes tipos de errores
  switch (err.name) {
    case 'ValidationError':
      statusCode = HttpStatus.BAD_REQUEST;
      message = 'Error de validación en los datos enviados';
      errorCode = ErrorTypes.VALIDATION_ERROR;
      break;

    case 'UnauthorizedError':
    case 'JsonWebTokenError':
    case 'TokenExpiredError':
      statusCode = HttpStatus.UNAUTHORIZED;
      message = 'Token de autenticación inválido o expirado';
      errorCode = ErrorTypes.AUTHENTICATION_ERROR;
      break;

    case 'CastError':
      statusCode = HttpStatus.BAD_REQUEST;
      message = 'ID o parámetro inválido';
      errorCode = ErrorTypes.VALIDATION_ERROR;
      break;

    case 'MongoError':
    case 'MongooseError':
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Error en la base de datos';
      errorCode = ErrorTypes.DATABASE_ERROR;
      break;

    case 'SyntaxError':
      if (err.message.includes('JSON')) {
        statusCode = HttpStatus.BAD_REQUEST;
        message = 'JSON mal formado en la petición';
        errorCode = ErrorTypes.VALIDATION_ERROR;
      }
      break;

    case 'MulterError':
      statusCode = HttpStatus.BAD_REQUEST;
      message = 'Error en la carga de archivos';
      errorCode = ErrorTypes.VALIDATION_ERROR;
      break;
  }

  // Manejo especial para errores de rate limiting
  if (err.message && err.message.includes('Too many requests')) {
    statusCode = HttpStatus.TOO_MANY_REQUESTS;
    message = 'Demasiadas peticiones, intenta más tarde';
    errorCode = ErrorTypes.RATE_LIMIT_ERROR;
  }

  // En producción, no mostrar detalles del error si no es operacional
  if (config.NODE_ENV === 'production' && !err.isOperational) {
    message = 'Algo salió mal en el servidor';
    errorCode = ErrorTypes.INTERNAL_ERROR;
  }

  // Respuesta mejorada con código de error
  const errorResponse = {
    success: false,
    error: message,
    code: errorCode,
    timestamp: new Date().toISOString(),
    ...(config.NODE_ENV === 'development' && err.isOperational && {
      details: err.details,
      stack: err.stack?.split('\n').slice(0, 5) // Solo primeras 5 líneas del stack
    })
  };

  res.status(statusCode).json(errorResponse);
};

/**
 * Middleware para capturar rutas no encontradas
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  ResponseUtil.notFound(res, `Ruta ${req.originalUrl} no encontrada`);
};

/**
 * Wrapper mejorado para funciones async en controladores
 */
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch((error) => {
    // Si no es un error operacional, lo marcamos como tal
    if (!(error instanceof AppError)) {
      const appError = new AppError(
        error.message || 'Error inesperado en el servidor',
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorTypes.INTERNAL_ERROR,
        { originalError: error.name },
        false // No es operacional
      );
      next(appError);
    } else {
      next(error);
    }
  });
};

/**
 * Funciones de utilidad para crear errores específicos
 */
export const createError = {
  validation: (message: string, details?: any) => 
    new AppError(message, HttpStatus.BAD_REQUEST, ErrorTypes.VALIDATION_ERROR, details),
  
  notFound: (resource: string = 'Recurso') => 
    new AppError(`${resource} no encontrado`, HttpStatus.NOT_FOUND, ErrorTypes.NOT_FOUND_ERROR),
  
  unauthorized: (message: string = 'No autorizado') => 
    new AppError(message, HttpStatus.UNAUTHORIZED, ErrorTypes.AUTHENTICATION_ERROR),
  
  forbidden: (message: string = 'Acceso denegado') => 
    new AppError(message, HttpStatus.FORBIDDEN, ErrorTypes.AUTHORIZATION_ERROR),
  
  database: (message: string = 'Error en la base de datos', details?: any) => 
    new AppError(message, HttpStatus.INTERNAL_SERVER_ERROR, ErrorTypes.DATABASE_ERROR, details),
  
  external: (message: string = 'Error en servicio externo', details?: any) => 
    new AppError(message, HttpStatus.BAD_GATEWAY, ErrorTypes.EXTERNAL_API_ERROR, details),
  
  rateLimit: (message: string = 'Demasiadas peticiones') => 
    new AppError(message, HttpStatus.TOO_MANY_REQUESTS, ErrorTypes.RATE_LIMIT_ERROR)
};

/**
 * Middleware para capturar errores síncronos no manejados
 */
export const globalErrorCatcher = () => {
  // Capturar errores no manejados
  process.on('uncaughtException', async (error) => {
    console.error('🆘 UNCAUGHT EXCEPTION:', error);
    await ErrorLogger.logError(error as CustomError, undefined, { type: 'uncaughtException' });
    
    // En producción, cerrar la aplicación de forma elegante
    if (config.NODE_ENV === 'production') {
      console.error('🛑 Cerrando aplicación por error crítico...');
      process.exit(1);
    }
  });

  // Capturar promesas rechazadas no manejadas
  process.on('unhandledRejection', async (reason, promise) => {
    console.error('🚨 UNHANDLED REJECTION at:', promise, 'reason:', reason);
    const error = reason instanceof Error ? reason : new Error(String(reason));
    await ErrorLogger.logError(error as CustomError, undefined, { type: 'unhandledRejection' });
    
    // En producción, cerrar la aplicación de forma elegante
    if (config.NODE_ENV === 'production') {
      console.error('🛑 Cerrando aplicación por promesa rechazada...');
      process.exit(1);
    }
  });

  console.log('✅ Sistema de captura global de errores inicializado');
};
