import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { AppService } from '../services/AppService';
import { asyncHandler, createError, AppError } from '../middlewares/errorHandler';

export class AppController extends BaseController {
  private appService: AppService;

  constructor() {
    super();
    this.appService = new AppService();
  }

  /**
   * GET / - Información básica de la aplicación
   */
  getAppInfo = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
    const result = this.appService.getAppInfo();
    return this.handleServiceResponse(res, result);
  });

  /**
   * GET /saludo/:nombre - Saludo personalizado
   */
  getPersonalizedGreeting = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
    const name = this.getParam(req, 'nombre');
    
    // Ejemplo de validación con el nuevo sistema de errores
    if (!name || name.trim().length === 0) {
      throw createError.validation('El nombre es requerido y no puede estar vacío');
    }
    
    if (name.length > 50) {
      throw createError.validation('El nombre no puede exceder 50 caracteres', { maxLength: 50, provided: name.length });
    }
    
    // Ejemplo de validación de caracteres especiales
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(name)) {
      throw createError.validation('El nombre solo puede contener letras y espacios');
    }
    
    const result = this.appService.getPersonalizedGreeting(name);
    return this.handleServiceResponse(res, result);
  });

  /**
   * GET /health - Estado de salud de la API
   */
  getHealthStatus = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
    const result = this.appService.getHealthStatus();
    return this.handleServiceResponse(res, result);
  });

  /**
   * GET /config - Configuración actual (solo desarrollo)
   */
  getConfigInfo = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
    const result = this.appService.getConfigInfo();
    return this.handleServiceResponse(res, result);
  });

  /**
   * POST /test-error - Endpoint para probar diferentes tipos de errores
   */
  testError = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
    const { type } = req.body;
    
    switch (type) {
      case 'validation':
        throw createError.validation('Error de validación de prueba', { field: 'test', value: 'invalid' });
      
      case 'notFound':
        throw createError.notFound('Usuario');
      
      case 'unauthorized':
        throw createError.unauthorized('Token inválido o expirado');
      
      case 'forbidden':
        throw createError.forbidden('No tienes permisos para acceder a este recurso');
      
      case 'database':
        throw createError.database('Error conectando a la base de datos', { connection: 'mongodb://localhost:27017' });
      
      case 'external':
        throw createError.external('Error en API externa', { service: 'PaymentGateway', endpoint: '/charge' });
      
      case 'rateLimit':
        throw createError.rateLimit('Has excedido el límite de peticiones');
      
      case 'unexpected':
        // Esto simulará un error no operacional
        throw new Error('Error inesperado no capturado');
      
      default:
        const result = {
          success: true,
          data: {
            message: 'Tipos de error disponibles',
            types: ['validation', 'notFound', 'unauthorized', 'forbidden', 'database', 'external', 'rateLimit', 'unexpected']
          }
        };
        return this.handleServiceResponse(res, result);
    }
  });
}
