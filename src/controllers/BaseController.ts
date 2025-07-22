import { Request, Response } from 'express';
import { ResponseUtil } from '../utils/response';
import { ServiceResponse, HttpStatus } from '../types';

export abstract class BaseController {
  /**
   * Maneja la respuesta del servicio y la envía al cliente
   */
  protected handleServiceResponse<T>(
    res: Response,
    serviceResponse: ServiceResponse<T>,
    successStatus: number = HttpStatus.OK
  ): Response {
    if (serviceResponse.success) {
      return ResponseUtil.success(
        res,
        serviceResponse.data,
        serviceResponse.message,
        successStatus
      );
    } else {
      const status = this.getErrorStatus(serviceResponse.error || '');
      return ResponseUtil.error(res, serviceResponse.error || 'Error desconocido', status);
    }
  }

  /**
   * Determina el código de estado HTTP basado en el mensaje de error
   */
  private getErrorStatus(errorMessage: string): number {
    const message = errorMessage.toLowerCase();
    
    if (message.includes('no encontrado')) {
      return HttpStatus.NOT_FOUND;
    }
    
    if (message.includes('requerido') || message.includes('validación')) {
      return HttpStatus.BAD_REQUEST;
    }
    
    if (message.includes('no autorizado') || message.includes('token')) {
      return HttpStatus.UNAUTHORIZED;
    }
    
    if (message.includes('prohibido') || message.includes('producción')) {
      return HttpStatus.FORBIDDEN;
    }
    
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  /**
   * Extrae parámetros de la URL de forma segura
   */
  protected getParam(req: Request, paramName: string): string {
    const param = req.params[paramName];
    if (!param) {
      throw new Error(`Parámetro ${paramName} es requerido`);
    }
    return param.trim();
  }

  /**
   * Extrae query parameters de forma segura
   */
  protected getQuery(req: Request, queryName: string, defaultValue?: string): string | undefined {
    const query = req.query[queryName] as string;
    return query?.trim() || defaultValue;
  }

  /**
   * Valida el body de la request
   */
  protected validateBody<T>(req: Request, requiredFields: string[]): T {
    const body = req.body;
    
    if (!body || typeof body !== 'object') {
      throw new Error('Body de la request es requerido');
    }

    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Campos requeridos faltantes: ${missingFields.join(', ')}`);
    }

    return body as T;
  }
}
