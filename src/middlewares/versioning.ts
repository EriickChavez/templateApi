import { Request, Response, NextFunction } from 'express';

// Interface para información de versión
export interface VersionInfo {
  version: string;
  deprecated: boolean;
  deprecationDate?: string;
  supportEndDate?: string;
  migrationGuide?: string;
}

// Versiones soportadas
export const SUPPORTED_VERSIONS: Record<string, VersionInfo> = {
  'v1': {
    version: 'v1',
    deprecated: false
  },
  'v2': {
    version: 'v2', 
    deprecated: false
  }
};

// Versión por defecto
export const DEFAULT_VERSION = 'v1';

// Extender Request para incluir información de versión
declare global {
  namespace Express {
    interface Request {
      apiVersion: string;
      versionInfo: VersionInfo;
    }
  }
}

// Extraer versión del request
function extractVersion(req: Request): string {
  // 1. Prioridad: Header Accept-Version
  const acceptVersionHeader = req.headers['accept-version'] as string;
  if (acceptVersionHeader) {
    return acceptVersionHeader.toLowerCase();
  }

  // 2. Header API-Version (alternativo)
  const apiVersionHeader = req.headers['api-version'] as string;
  if (apiVersionHeader) {
    return apiVersionHeader.toLowerCase();
  }

  // 3. URL path (ej: /v1/users)
  const pathMatch = req.path.match(/^\/v(\d+)/);
  if (pathMatch) {
    return `v${pathMatch[1]}`;
  }

  // 4. Query parameter
  const versionParam = req.query.version as string;
  if (versionParam) {
    return versionParam.toLowerCase();
  }

  // 5. Default version
  return DEFAULT_VERSION;
}

// Middleware principal de versionado
export const versioningMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const requestedVersion = extractVersion(req);
  
  // Verificar si la versión es soportada
  if (!SUPPORTED_VERSIONS[requestedVersion]) {
    return res.status(400).json({
      success: false,
      message: `API version '${requestedVersion}' is not supported`,
      data: null,
      meta: {
        supportedVersions: Object.keys(SUPPORTED_VERSIONS),
        requestedVersion,
        correlationId: req.correlationId,
        timestamp: new Date().toISOString(),
        version: DEFAULT_VERSION
      },
      errors: [{
        code: 'UNSUPPORTED_VERSION',
        message: `Version '${requestedVersion}' is not supported`,
        supportedVersions: Object.keys(SUPPORTED_VERSIONS)
      }]
    });
  }

  const versionInfo = SUPPORTED_VERSIONS[requestedVersion];
  
  // Asignar información de versión al request
  req.apiVersion = requestedVersion;
  req.versionInfo = versionInfo;
  
  // Headers de respuesta
  res.setHeader('API-Version', requestedVersion);
  res.setHeader('Supported-Versions', Object.keys(SUPPORTED_VERSIONS).join(', '));
  
  // Warning para versiones deprecadas
  if (versionInfo.deprecated) {
    res.setHeader('Deprecation', 'true');
    if (versionInfo.deprecationDate) {
      res.setHeader('Deprecation-Date', versionInfo.deprecationDate);
    }
    if (versionInfo.supportEndDate) {
      res.setHeader('Sunset', versionInfo.supportEndDate);
    }
    if (versionInfo.migrationGuide) {
      res.setHeader('Link', `<${versionInfo.migrationGuide}>; rel=\"migration-guide\"`);
    }
    
    console.warn(`⚠️ DEPRECATED API VERSION: ${requestedVersion} used by ${req.ip}`, {
      correlationId: req.correlationId,
      version: requestedVersion,
      url: req.url,
      userAgent: req.headers['user-agent'],
      deprecationInfo: versionInfo
    });
  }
  
  next();
};

// Middleware para enforcer una versión específica
export const requireVersion = (version: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.apiVersion !== version) {
      return res.status(400).json({
        success: false,
        message: `This endpoint requires API version '${version}'`,
        data: null,
        meta: {
          requiredVersion: version,
          providedVersion: req.apiVersion,
          correlationId: req.correlationId,
          timestamp: new Date().toISOString(),
          version: req.apiVersion
        },
        errors: [{
          code: 'VERSION_MISMATCH',
          message: `Expected version '${version}', got '${req.apiVersion}'`
        }]
      });
    }
    next();
  };
};

// Decorador para marcar endpoints como deprecados
export const deprecated = (options: {
  since?: string;
  removeIn?: string;
  migrationGuide?: string;
  alternative?: string;
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Headers de deprecación
    res.setHeader('Deprecation', 'true');
    if (options.since) {
      res.setHeader('Deprecation-Date', options.since);
    }
    if (options.removeIn) {
      res.setHeader('Sunset', options.removeIn);
    }
    if (options.migrationGuide) {
      res.setHeader('Link', `<${options.migrationGuide}>; rel=\"migration-guide\"`);
    }
    
    // Log de uso de endpoint deprecado
    console.warn(`🚨 DEPRECATED ENDPOINT: ${req.method} ${req.url}`, {
      correlationId: req.correlationId,
      deprecation: options,
      userAgent: req.headers['user-agent'],
      ip: req.ip
    });
    
    next();
  };
};

// Helper para responses con información de versión
export const addVersionToResponse = (data: any, req: Request): any => {
  if (typeof data === 'object' && data !== null) {
    if (data.meta) {
      data.meta.version = req.apiVersion;
      data.meta.versionInfo = req.versionInfo;
    } else {
      data.meta = {
        version: req.apiVersion,
        versionInfo: req.versionInfo,
        timestamp: new Date().toISOString(),
        correlationId: req.correlationId
      };
    }
  }
  return data;
};

// Endpoint para obtener información de versiones
export const versionInfoEndpoint = (req: Request, res: Response) => {
  const currentVersion = req.apiVersion || DEFAULT_VERSION;
  
  res.json({
    success: true,
    message: 'API version information',
    data: {
      currentVersion,
      defaultVersion: DEFAULT_VERSION,
      supportedVersions: SUPPORTED_VERSIONS,
      requestInfo: {
        detectedVersion: currentVersion,
        versionSource: getVersionSource(req),
        headers: {
          'accept-version': req.headers['accept-version'],
          'api-version': req.headers['api-version']
        }
      }
    },
    meta: {
      correlationId: req.correlationId,
      timestamp: new Date().toISOString(),
      version: currentVersion
    }
  });
};

// Helper para identificar de dónde viene la versión
function getVersionSource(req: Request): string {
  if (req.headers['accept-version']) return 'Accept-Version header';
  if (req.headers['api-version']) return 'API-Version header';
  if (req.path.match(/^\/v\d+/)) return 'URL path';
  if (req.query.version) return 'Query parameter';
  return 'Default version';
}

// Middleware para transformar respuestas según la versión
export const versionResponseTransform = (req: Request, res: Response, next: NextFunction) => {
  const originalJson = res.json;
  
  res.json = function(data: any) {
    // Transformar datos según la versión
    const transformedData = transformDataForVersion(data, req.apiVersion);
    
    // Agregar información de versión
    const dataWithVersion = addVersionToResponse(transformedData, req);
    
    return originalJson.call(this, dataWithVersion);
  };
  
  next();
};

// Función para transformar datos según la versión (personalizable)
function transformDataForVersion(data: any, version: string): any {
  // Aquí puedes implementar transformaciones específicas por versión
  switch (version) {
    case 'v1':
      // Transformaciones para v1
      return data;
    case 'v2':
      // Transformaciones para v2 (ej: cambios en estructura de respuesta)
      return data;
    default:
      return data;
  }
}
