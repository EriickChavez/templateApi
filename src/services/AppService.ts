import { BaseService } from './BaseService';
import { ServiceResponse } from '../types';
import { config } from '../config/env';

export interface AppInfo {
  message: string;
  version: string;
  environment: string;
  uptime: number;
}

export interface HealthStatus {
  status: string;
  version: string;
  environment: string;
  uptime: number;
  memory: {
    used: string;
    total: string;
  };
}

export interface ConfigInfo {
  environment: string;
  version: string;
  port: number;
  corsOrigin: string;
  logLevel: string;
  databaseConfigured: boolean;
  jwtConfigured: boolean;
}

export class AppService extends BaseService {
  /**
   * Obtiene información básica de la aplicación
   */
  getAppInfo(): ServiceResponse<AppInfo> {
    try {
      const data: AppInfo = {
        message: '¡Hola Mundo!',
        version: config.API_VERSION,
        environment: config.NODE_ENV,
        uptime: process.uptime()
      };

      return this.success(data, 'Información de la aplicación obtenida exitosamente');
    } catch (error) {
      return this.failure(`Error al obtener información: ${error}`);
    }
  }

  /**
   * Obtiene saludo personalizado
   */
  getPersonalizedGreeting(name: string): ServiceResponse<{ message: string }> {
    try {
      this.validateRequired(name, 'Nombre');
      
      // Sanitizar el nombre
      const cleanName = name.trim().replace(/[<>]/g, '');
      
      if (cleanName.length === 0) {
        return this.failure('El nombre no puede estar vacío');
      }

      const data = {
        message: `¡Hola ${cleanName}!`
      };

      return this.success(data, 'Saludo generado exitosamente');
    } catch (error) {
      return this.failure(`Error al generar saludo: ${error}`);
    }
  }

  /**
   * Obtiene el estado de salud de la aplicación
   */
  getHealthStatus(): ServiceResponse<HealthStatus> {
    try {
      const memoryUsage = process.memoryUsage();
      
      const data: HealthStatus = {
        status: 'API funcionando correctamente',
        version: config.API_VERSION,
        environment: config.NODE_ENV,
        uptime: process.uptime(),
        memory: {
          used: Math.round(memoryUsage.rss / 1024 / 1024) + ' MB',
          total: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB'
        }
      };

      return this.success(data, 'Estado de salud obtenido exitosamente');
    } catch (error) {
      return this.failure(`Error al obtener estado: ${error}`);
    }
  }

  /**
   * Obtiene configuración actual (solo desarrollo)
   */
  getConfigInfo(): ServiceResponse<ConfigInfo> {
    try {
      if (config.NODE_ENV === 'production') {
        return this.failure('Endpoint no disponible en producción');
      }

      const data: ConfigInfo = {
        environment: config.NODE_ENV,
        version: config.API_VERSION,
        port: config.PORT,
        corsOrigin: config.CORS_ORIGIN,
        logLevel: config.LOG_LEVEL,
        databaseConfigured: !!config.DATABASE_URL,
        jwtConfigured: !!config.JWT_SECRET
      };

      return this.success(data, 'Configuración obtenida exitosamente');
    } catch (error) {
      return this.failure(`Error al obtener configuración: ${error}`);
    }
  }
}
