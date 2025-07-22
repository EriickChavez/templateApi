import { Response } from 'express';
import { ApiResponse, HttpStatus } from '../types';

export class ResponseUtil {
  /**
   * Envía una respuesta exitosa
   */
  static success<T>(res: Response, data?: T, message?: string, status: number = HttpStatus.OK): Response {
    const response: ApiResponse<T> = {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString()
    };
    return res.status(status).json(response);
  }

  /**
   * Envía una respuesta de error
   */
  static error(res: Response, error: string, status: number = HttpStatus.INTERNAL_SERVER_ERROR): Response {
    const response: ApiResponse = {
      success: false,
      error,
      timestamp: new Date().toISOString()
    };
    return res.status(status).json(response);
  }

  /**
   * Envía una respuesta de validación fallida
   */
  static validationError(res: Response, errors: string[]): Response {
    const response: ApiResponse = {
      success: false,
      error: 'Errores de validación',
      data: errors,
      timestamp: new Date().toISOString()
    };
    return res.status(HttpStatus.BAD_REQUEST).json(response);
  }

  /**
   * Envía una respuesta de recurso no encontrado
   */
  static notFound(res: Response, resource: string = 'Recurso'): Response {
    const response: ApiResponse = {
      success: false,
      error: `${resource} no encontrado`,
      timestamp: new Date().toISOString()
    };
    return res.status(HttpStatus.NOT_FOUND).json(response);
  }

  /**
   * Envía una respuesta de no autorizado
   */
  static unauthorized(res: Response, message: string = 'No autorizado'): Response {
    const response: ApiResponse = {
      success: false,
      error: message,
      timestamp: new Date().toISOString()
    };
    return res.status(HttpStatus.UNAUTHORIZED).json(response);
  }

  /**
   * Envía una respuesta de recurso creado
   */
  static created<T>(res: Response, data: T, message: string = 'Recurso creado exitosamente'): Response {
    return ResponseUtil.success(res, data, message, HttpStatus.CREATED);
  }
}
