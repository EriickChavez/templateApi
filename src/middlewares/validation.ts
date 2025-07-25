import { Request, Response, NextFunction } from 'express';
import { validate, ValidationError } from 'class-validator';
import { plainToClass, Transform } from 'class-transformer';
import { BaseResponseDto } from '../dto/BaseDto';

// Enum para especificar dónde validar
export enum ValidationSource {
  BODY = 'body',
  QUERY = 'query',
  PARAMS = 'params',
  HEADERS = 'headers'
}

// Interface para errores de validación formateados
interface FormattedValidationError {
  field: string;
  value: any;
  constraints: string[];
  children?: FormattedValidationError[];
}

// Clase para manejar validaciones
export class ValidationHelper {
  // Formatear errores de class-validator
  static formatValidationErrors(errors: ValidationError[]): FormattedValidationError[] {
    return errors.map(error => ({
      field: error.property,
      value: error.value,
      constraints: error.constraints ? Object.values(error.constraints) : [],
      children: error.children && error.children.length > 0 
        ? this.formatValidationErrors(error.children)
        : undefined
    }));
  }

  // Crear respuesta de error de validación
  static createValidationErrorResponse(
    errors: FormattedValidationError[],
    source: ValidationSource,
    correlationId?: string
  ): BaseResponseDto<null> {
    return new BaseResponseDto(
      false,
      `Validation failed for ${source}`,
      null,
      {
        correlationId,
        validationSource: source,
        errorCount: errors.length
      },
      errors
    );
  }

  // Validar un objeto contra una clase DTO
  static async validateObject<T extends object>(
    DtoClass: new () => T,
    data: any,
    source: ValidationSource = ValidationSource.BODY
  ): Promise<{ isValid: boolean; validatedData?: T; errors?: FormattedValidationError[] }> {
    try {
      // Transformar plain object a instancia de clase con validaciones
      const dto = plainToClass(DtoClass, data);
      
      // Ejecutar validaciones
      const validationErrors = await validate(dto, {
        whitelist: true, // Solo propiedades definidas en el DTO
        forbidNonWhitelisted: true, // Rechazar propiedades no definidas
        transform: true, // Aplicar transformaciones automáticamente
        validationError: { 
          target: false, // No incluir el objeto completo en errores
          value: false // No incluir valores en errores sensibles
        }
      });

      if (validationErrors.length > 0) {
        return {
          isValid: false,
          errors: this.formatValidationErrors(validationErrors)
        };
      }

      return {
        isValid: true,
        validatedData: dto
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [{
          field: 'general',
          value: null,
          constraints: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`]
        }]
      };
    }
  }
}

// Decorator/factory para crear middleware de validación
export function validateDto<T extends object>(
  DtoClass: new () => T,
  source: ValidationSource = ValidationSource.BODY,
  options: {
    optional?: boolean; // Permite que el objeto sea undefined
    skipTransform?: boolean; // No transformar, solo validar
  } = {}
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req[source];
      
      // Si es opcional y no hay data, continuar
      if (options.optional && (!data || Object.keys(data).length === 0)) {
        return next();
      }

      // Validar el objeto
      const validation = await ValidationHelper.validateObject(DtoClass, data, source);
      
      if (!validation.isValid) {
        const errorResponse = ValidationHelper.createValidationErrorResponse(
          validation.errors!,
          source,
          req.correlationId
        );
        
        return res.status(400).json(errorResponse);
      }

      // Asignar datos validados y transformados al request
      if (!options.skipTransform && validation.validatedData) {
        (req as any)[`validated${source.charAt(0).toUpperCase() + source.slice(1)}`] = validation.validatedData;
      }

      next();
    } catch (error) {
      console.error('Validation middleware error:', error);
      
      const errorResponse = new BaseResponseDto(
        false,
        'Internal validation error',
        null,
        { correlationId: req.correlationId },
        [{
          field: 'system',
          value: null,
          constraints: ['Internal validation error occurred']
        }]
      );
      
      return res.status(500).json(errorResponse);
    }
  };
}

// Middlewares específicos para diferentes fuentes
export const validateBody = <T extends object>(DtoClass: new () => T, options?: { optional?: boolean }) => 
  validateDto(DtoClass, ValidationSource.BODY, options);

export const validateQuery = <T extends object>(DtoClass: new () => T, options?: { optional?: boolean }) =>
  validateDto(DtoClass, ValidationSource.QUERY, options);

export const validateParams = <T extends object>(DtoClass: new () => T, options?: { optional?: boolean }) =>
  validateDto(DtoClass, ValidationSource.PARAMS, options);

// Middleware para validación manual (para casos complejos)
export const manualValidation = (
  validationFn: (req: Request) => Promise<{ isValid: boolean; errors?: any[] }>
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validation = await validationFn(req);
      
      if (!validation.isValid) {
        const errorResponse = new BaseResponseDto(
          false,
          'Custom validation failed',
          null,
          { correlationId: req.correlationId },
          validation.errors
        );
        
        return res.status(400).json(errorResponse);
      }
      
      next();
    } catch (error) {
      console.error('Manual validation error:', error);
      
      const errorResponse = new BaseResponseDto(
        false,
        'Validation error',
        null,
        { correlationId: req.correlationId },
        [{
          field: 'validation',
          constraints: ['Validation process failed']
        }]
      );
      
      return res.status(500).json(errorResponse);
    }
  };
};

// Middleware para sanitizar datos después de validación
export const sanitizeData = (fields: string[] = []) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Sanitizar campos específicos o todos si no se especifican
      const sanitizeObject = (obj: any, fieldsToSanitize: string[]) => {
        if (!obj || typeof obj !== 'object') return obj;
        
        const sanitized = { ...obj };
        
        for (const field of fieldsToSanitize) {
          if (sanitized[field] && typeof sanitized[field] === 'string') {
            // Sanitizar HTML/scripts básicos
            sanitized[field] = sanitized[field]
              .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
              .replace(/<[^>]+>/g, '')
              .trim();
          }
        }
        
        return sanitized;
      };

      if (fields.length > 0) {
        if (req.body) {
          req.body = sanitizeObject(req.body, fields);
        }
        if (req.query) {
          req.query = sanitizeObject(req.query, fields);
        }
      }
      
      next();
    } catch (error) {
      console.error('Sanitization error:', error);
      next();
    }
  };
};

// Helper para crear validadores condicionales
export const conditionalValidation = (
  condition: (req: Request) => boolean,
  validator: (req: Request, res: Response, next: NextFunction) => void
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (condition(req)) {
      return validator(req, res, next);
    }
    next();
  };
};

// Middleware para combinar múltiples validaciones
export const combineValidations = (...validators: Array<(req: Request, res: Response, next: NextFunction) => void>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    for (const validator of validators) {
      await new Promise<void>((resolve, reject) => {
        validator(req, res, (error?: any) => {
          if (error) {
            reject(error);
          } else if (res.headersSent) {
            // Si la respuesta ya fue enviada (error de validación), no continuar
            resolve();
          } else {
            resolve();
          }
        });
      }).catch((error) => {
        return next(error);
      });
      
      // Si la respuesta ya fue enviada, detener
      if (res.headersSent) {
        return;
      }
    }
    
    next();
  };
};
