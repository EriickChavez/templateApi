import { Request, Response, NextFunction } from 'express';
import mongoSanitize from 'express-mongo-sanitize';
import { sanitizeObject, sanitizeString, SANITIZATION_LEVELS, fieldSanitizers } from '../utils/sanitizer';

// Configuración de mongo-sanitize
const mongoSanitizeOptions = {
  onSanitize: ({ req, key }: { req: Request; key: string }) => {
    console.warn(`⚠️ Removed potentially dangerous key: ${key} from request`);
  },
  replaceWith: '_'
};

/**
 * Middleware para sanitización NoSQL injection
 * NOTA: Este middleware puede causar conflictos con req.query en Express 5.x
 * Se recomienda usarlo con precaución o implementar validación NoSQL custom
 */
export const mongoSanitization = mongoSanitize({
  ...mongoSanitizeOptions,
  // Evitar modificar req.query directamente
  onSanitize: ({ req, key }: { req: Request; key: string }) => {
    console.warn(`⚠️ Elemento NoSQL peligroso removido: ${key}`);
  }
});

/**
 * Middleware de sanitización general que se aplica a body, query y params
 */
export const generalSanitization = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Sanitizar body
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body, SANITIZATION_LEVELS.MODERATE);
    }

    // Para query parameters, no intentamos modificar req.query directamente
    // En su lugar, simplemente validamos que no contenga elementos peligrosos
    if (req.query && typeof req.query === 'object') {
      // Validar elementos peligrosos sin modificar req.query
      const validateQuery = (obj: any, path: string = 'query'): void => {
        if (typeof obj === 'string') {
          // Verificar patrones peligrosos básicos
          const dangerousPatterns = [
            /<script/gi,
            /javascript:/gi,
            /vbscript:/gi,
            /on\w+\s*=/gi,
            /(\$where|\$ne|\$gt|\$lt|\$gte|\$lte|\$in|\$nin|\$regex|\$exists|\$type)/gi
          ];
          
          for (const pattern of dangerousPatterns) {
            if (pattern.test(obj)) {
              throw new Error(`Patrón peligroso detectado en query parameter: ${path}`);
            }
          }
        } else if (typeof obj === 'object' && obj !== null) {
          for (const [key, value] of Object.entries(obj)) {
            validateQuery(value, `${path}.${key}`);
          }
        }
      };
      
      validateQuery(req.query);
    }

    // Sanitizar params
    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeObject(req.params, SANITIZATION_LEVELS.STRICT);
    }

    next();
  } catch (error) {
    console.error('❌ Error en sanitización general:', error);
    next(error);
  }
};

/**
 * Middleware de sanitización específica por ruta
 */
export const routeSpecificSanitization = (sanitizationRules: {
  body?: Record<string, keyof typeof fieldSanitizers | ((value: any) => any)>;
  query?: Record<string, keyof typeof fieldSanitizers | ((value: any) => any)>;
  params?: Record<string, keyof typeof fieldSanitizers | ((value: any) => any)>;
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Sanitizar body según reglas específicas
      if (sanitizationRules.body && req.body) {
        for (const [field, sanitizer] of Object.entries(sanitizationRules.body)) {
          if (req.body[field] !== undefined) {
            if (typeof sanitizer === 'function') {
              req.body[field] = sanitizer(req.body[field]);
            } else {
              req.body[field] = fieldSanitizers[sanitizer](req.body[field]);
            }
          }
        }
      }

      // Validar query según reglas específicas (sin modificar req.query)
      if (sanitizationRules.query && req.query) {
        for (const [field, sanitizer] of Object.entries(sanitizationRules.query)) {
          if (req.query[field] !== undefined) {
            // Solo validar que el valor sea seguro, sin modificarlo
            const value = req.query[field] as string;
            
            // Verificar patrones peligrosos básicos
            const dangerousPatterns = [
              /<script/gi,
              /javascript:/gi,
              /vbscript:/gi,
              /on\w+\s*=/gi,
              /(\$where|\$ne|\$gt|\$lt|\$gte|\$lte|\$in|\$nin|\$regex|\$exists|\$type)/gi
            ];
            
            for (const pattern of dangerousPatterns) {
              if (pattern.test(value)) {
                throw new Error(`Patrón peligroso detectado en query parameter ${field}: ${value}`);
              }
            }
          }
        }
      }

      // Sanitizar params según reglas específicas
      if (sanitizationRules.params && req.params) {
        for (const [field, sanitizer] of Object.entries(sanitizationRules.params)) {
          if (req.params[field] !== undefined) {
            if (typeof sanitizer === 'function') {
              req.params[field] = sanitizer(req.params[field]);
            } else {
              req.params[field] = fieldSanitizers[sanitizer](req.params[field]);
            }
          }
        }
      }

      next();
    } catch (error) {
      console.error('❌ Error en sanitización específica:', error);
      next(error);
    }
  };
};

/**
 * Middleware de protección contra HTTP Parameter Pollution (HPP)
 */
import hpp from 'hpp';
export const hppProtection = hpp({
  whitelist: ['tags', 'categories'] // Parámetros que pueden aparecer múltiples veces
});

/**
 * Middleware de protección contra ataques de caracteres null bytes
 */
export const nullByteProtection = (req: Request, res: Response, next: NextFunction) => {
  const checkForNullBytes = (obj: any, path: string = ''): boolean => {
    if (typeof obj === 'string') {
      if (obj.includes('\0')) {
        console.warn(`⚠️ Null byte detected in ${path}`);
        return true;
      }
    } else if (typeof obj === 'object' && obj !== null) {
      for (const [key, value] of Object.entries(obj)) {
        if (checkForNullBytes(value, `${path}.${key}`)) {
          return true;
        }
      }
    }
    return false;
  };

  try {
    if (checkForNullBytes(req.body, 'body') || 
        checkForNullBytes(req.query, 'query') || 
        checkForNullBytes(req.params, 'params')) {
      return res.status(400).json({
        success: false,
        message: 'Caracteres peligrosos detectados en la solicitud',
        error: 'DANGEROUS_CHARACTERS'
      });
    }

    next();
  } catch (error) {
    console.error('❌ Error en protección null byte:', error);
    next(error);
  }
};

/**
 * Middleware de protección contra inyección de JavaScript
 */
export const jsInjectionProtection = (req: Request, res: Response, next: NextFunction) => {
  const dangerousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /on\w+\s*=/gi,
    /eval\s*\(/gi,
    /Function\s*\(/gi,
    /setTimeout\s*\(/gi,
    /setInterval\s*\(/gi
  ];

  const checkForDangerousJS = (obj: any, path: string = ''): boolean => {
    if (typeof obj === 'string') {
      for (const pattern of dangerousPatterns) {
        if (pattern.test(obj)) {
          console.warn(`⚠️ JavaScript injection attempt detected in ${path}: ${obj.substring(0, 100)}...`);
          return true;
        }
      }
    } else if (typeof obj === 'object' && obj !== null) {
      for (const [key, value] of Object.entries(obj)) {
        if (checkForDangerousJS(value, `${path}.${key}`)) {
          return true;
        }
      }
    }
    return false;
  };

  try {
    if (checkForDangerousJS(req.body, 'body') || 
        checkForDangerousJS(req.query, 'query') || 
        checkForDangerousJS(req.params, 'params')) {
      return res.status(400).json({
        success: false,
        message: 'Intento de inyección de código detectado',
        error: 'CODE_INJECTION_ATTEMPT'
      });
    }

    next();
  } catch (error) {
    console.error('❌ Error en protección JS injection:', error);
    next(error);
  }
};

/**
 * Middleware de protección contra path traversal
 */
export const pathTraversalProtection = (req: Request, res: Response, next: NextFunction) => {
  const pathTraversalPatterns = [
    /\.\.[\/\\]/g,
    /[\/\\]\.\.[\/\\]/g,
    /%2e%2e[\/\\]/gi,
    /%252e%252e[\/\\]/gi
  ];

  const checkForPathTraversal = (obj: any, path: string = ''): boolean => {
    if (typeof obj === 'string') {
      for (const pattern of pathTraversalPatterns) {
        if (pattern.test(obj)) {
          console.warn(`⚠️ Path traversal attempt detected in ${path}: ${obj}`);
          return true;
        }
      }
    } else if (typeof obj === 'object' && obj !== null) {
      for (const [key, value] of Object.entries(obj)) {
        if (checkForPathTraversal(value, `${path}.${key}`)) {
          return true;
        }
      }
    }
    return false;
  };

  try {
    if (checkForPathTraversal(req.body, 'body') || 
        checkForPathTraversal(req.query, 'query') || 
        checkForPathTraversal(req.params, 'params') ||
        checkForPathTraversal(req.url, 'url')) {
      return res.status(400).json({
        success: false,
        message: 'Intento de path traversal detectado',
        error: 'PATH_TRAVERSAL_ATTEMPT'
      });
    }

    next();
  } catch (error) {
    console.error('❌ Error en protección path traversal:', error);
    next(error);
  }
};

/**
 * Middleware de protección contra payloads extremadamente grandes
 */
export const sizeProtection = (options: {
  maxBodySize?: number;
  maxQueryStringSize?: number;
  maxUrlLength?: number;
} = {}) => {
  const {
    maxBodySize = 1024 * 1024, // 1MB
    maxQueryStringSize = 4096,  // 4KB
    maxUrlLength = 2048         // 2KB
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Verificar tamaño del body
      if (req.body && JSON.stringify(req.body).length > maxBodySize) {
        return res.status(413).json({
          success: false,
          message: 'Payload del body demasiado grande',
          error: 'PAYLOAD_TOO_LARGE'
        });
      }

      // Verificar tamaño del query string
      const queryString = JSON.stringify(req.query);
      if (queryString.length > maxQueryStringSize) {
        return res.status(413).json({
          success: false,
          message: 'Query string demasiado largo',
          error: 'QUERY_STRING_TOO_LARGE'
        });
      }

      // Verificar longitud de URL
      if (req.url.length > maxUrlLength) {
        return res.status(414).json({
          success: false,
          message: 'URL demasiado larga',
          error: 'URL_TOO_LONG'
        });
      }

      next();
    } catch (error) {
      console.error('❌ Error en protección de tamaño:', error);
      next(error);
    }
  };
};

/**
 * Middleware combinado que aplica todas las protecciones de sanitización
 */
export const fullSanitizationSuite = [
  sizeProtection(),
  nullByteProtection,
  pathTraversalProtection,
  jsInjectionProtection,
  // mongoSanitization, // Temporalmente deshabilitado para diagnóstico
  generalSanitization
  // HPP removido temporalmente para evitar conflictos con req.query
];

// Configuraciones predefinidas para diferentes tipos de endpoints
export const sanitizationPresets = {
  // Para endpoints de autenticación
  auth: routeSpecificSanitization({
    body: {
      email: 'email',
      password: 'password',
      firstName: 'name',
      lastName: 'name',
      currentPassword: 'password',
      newPassword: 'password'
    }
  }),

  // Para endpoints de búsqueda
  search: routeSpecificSanitization({
    query: {
      q: 'searchQuery',
      category: 'slug',
      page: (value) => Math.max(1, parseInt(value) || 1),
      limit: (value) => Math.min(100, Math.max(1, parseInt(value) || 10))
    }
  }),

  // Para endpoints de usuario
  user: routeSpecificSanitization({
    body: {
      firstName: 'name',
      lastName: 'name',
      email: 'email',
      phone: 'phone',
      bio: 'text'
    },
    params: {
      id: 'id',
      userId: 'id'
    }
  }),

  // Para endpoints que manejan contenido
  content: routeSpecificSanitization({
    body: {
      title: 'text',
      content: 'htmlContent',
      description: 'text',
      tags: (value) => Array.isArray(value) ? value.map(tag => fieldSanitizers.slug(tag)) : [],
      slug: 'slug'
    }
  })
};

export default {
  fullSanitizationSuite,
  sanitizationPresets,
  routeSpecific: routeSpecificSanitization,
  general: generalSanitization
};
