import { Request, Response, NextFunction } from 'express';
import { ResponseUtil } from '../utils/response';
import { HttpStatus } from '../types';
import { config } from '../config/env';

export interface CustomError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

/**
 * Middleware para manejo de errores global
 */
export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = err.statusCode || HttpStatus.INTERNAL_SERVER_ERROR;
  let message = err.message || 'Error interno del servidor';

  // Log del error (en desarrollo mostrar stack trace)
  if (config.NODE_ENV === 'development') {
    console.error('❌ Error:', {
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      body: req.body,
      timestamp: new Date().toISOString()
    });
  } else {
    console.error('❌ Error:', {
      message: err.message,
      url: req.originalUrl,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  }

  // Manejo específico para diferentes tipos de errores
  if (err.name === 'ValidationError') {
    statusCode = HttpStatus.BAD_REQUEST;
    message = 'Error de validación';
  }

  if (err.name === 'UnauthorizedError') {
    statusCode = HttpStatus.UNAUTHORIZED;
    message = 'Token inválido';
  }

  if (err.name === 'CastError') {
    statusCode = HttpStatus.BAD_REQUEST;
    message = 'ID inválido';
  }

  // En producción, no mostrar detalles del error
  if (config.NODE_ENV === 'production' && !err.isOperational) {
    message = 'Algo salió mal!';
  }

  ResponseUtil.error(res, message, statusCode);
};

/**
 * Middleware para capturar rutas no encontradas
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  ResponseUtil.notFound(res, `Ruta ${req.originalUrl} no encontrada`);
};

/**
 * Wrapper para funciones async en controladores
 */
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
