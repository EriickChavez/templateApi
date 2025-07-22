import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { AppService } from '../services/AppService';
import { asyncHandler } from '../middlewares/errorHandler';

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
}
