import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import validator from 'validator';

// Configurar DOMPurify para servidor
const window = new JSDOM('').window;
const purify = DOMPurify(window as any);

// Patrones peligrosos comunes
const DANGEROUS_PATTERNS = {
  // SQL Injection
  SQL_INJECTION: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
  
  // NoSQL Injection
  NOSQL_INJECTION: /(\$where|\$ne|\$gt|\$lt|\$gte|\$lte|\$in|\$nin|\$regex|\$exists|\$type)/gi,
  
  // XSS básico
  XSS_BASIC: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  
  // JavaScript events
  JS_EVENTS: /on\w+\s*=/gi,
  
  // Data URLs peligrosos
  DATA_URL: /data:\s*[^;]*;[^,]*,/gi,
  
  // Expresiones JavaScript
  JS_EXPRESSIONS: /(javascript:|vbscript:|data:text\/html)/gi,
  
  // LDAP Injection
  LDAP_INJECTION: /[()&|=!<>~]/g,
  
  // Path traversal
  PATH_TRAVERSAL: /\.\.[\/\\]/g,
  
  // Command injection
  COMMAND_INJECTION: /[;&|`$(){}[\]]/g
};

// Configuración de sanitización por contexto
export const SANITIZATION_LEVELS = {
  STRICT: 'strict',
  MODERATE: 'moderate',
  BASIC: 'basic',
  HTML_SAFE: 'html_safe'
} as const;

export type SanitizationLevel = typeof SANITIZATION_LEVELS[keyof typeof SANITIZATION_LEVELS];

// Configuraciones específicas para diferentes contextos
const SANITIZATION_CONFIGS = {
  [SANITIZATION_LEVELS.STRICT]: {
    allowHTML: false,
    allowSpecialChars: false,
    maxLength: 255,
    trimWhitespace: true,
    normalizeUnicode: true,
    blockDangerousPatterns: true,
    escapeHtml: true
  },
  [SANITIZATION_LEVELS.MODERATE]: {
    allowHTML: false,
    allowSpecialChars: true,
    maxLength: 1000,
    trimWhitespace: true,
    normalizeUnicode: true,
    blockDangerousPatterns: true,
    escapeHtml: false
  },
  [SANITIZATION_LEVELS.BASIC]: {
    allowHTML: false,
    allowSpecialChars: true,
    maxLength: 5000,
    trimWhitespace: true,
    normalizeUnicode: false,
    blockDangerousPatterns: true,
    escapeHtml: false
  },
  [SANITIZATION_LEVELS.HTML_SAFE]: {
    allowHTML: true,
    allowSpecialChars: true,
    maxLength: 10000,
    trimWhitespace: true,
    normalizeUnicode: false,
    blockDangerousPatterns: true,
    escapeHtml: false
  }
};

/**
 * Sanitiza una cadena de texto según el nivel especificado
 */
export function sanitizeString(
  input: string, 
  level: SanitizationLevel = SANITIZATION_LEVELS.MODERATE,
  customConfig?: Partial<typeof SANITIZATION_CONFIGS[typeof SANITIZATION_LEVELS.MODERATE]>
): string {
  if (typeof input !== 'string') {
    return String(input || '');
  }

  const config = { ...SANITIZATION_CONFIGS[level], ...customConfig };
  let sanitized = input;

  // 1. Trim whitespace si está habilitado
  if (config.trimWhitespace) {
    sanitized = sanitized.trim();
  }

  // 2. Truncar según longitud máxima
  if (config.maxLength && sanitized.length > config.maxLength) {
    sanitized = sanitized.substring(0, config.maxLength);
  }

  // 3. Normalizar Unicode si está habilitado
  if (config.normalizeUnicode) {
    sanitized = sanitized.normalize('NFC');
  }

  // 4. Bloquear patrones peligrosos
  if (config.blockDangerousPatterns) {
    // SQL Injection
    if (DANGEROUS_PATTERNS.SQL_INJECTION.test(sanitized)) {
      sanitized = sanitized.replace(DANGEROUS_PATTERNS.SQL_INJECTION, '');
    }

    // NoSQL Injection
    if (DANGEROUS_PATTERNS.NOSQL_INJECTION.test(sanitized)) {
      sanitized = sanitized.replace(DANGEROUS_PATTERNS.NOSQL_INJECTION, '');
    }

    // XSS básico
    sanitized = sanitized.replace(DANGEROUS_PATTERNS.XSS_BASIC, '');
    sanitized = sanitized.replace(DANGEROUS_PATTERNS.JS_EVENTS, '');
    sanitized = sanitized.replace(DANGEROUS_PATTERNS.JS_EXPRESSIONS, '');
    sanitized = sanitized.replace(DANGEROUS_PATTERNS.DATA_URL, '');

    // Path traversal
    sanitized = sanitized.replace(DANGEROUS_PATTERNS.PATH_TRAVERSAL, '');
  }

  // 5. Procesar HTML según configuración
  if (config.allowHTML) {
    // Usar DOMPurify para limpiar HTML manteniendo elementos seguros
    sanitized = purify.sanitize(sanitized, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
      ALLOWED_ATTR: ['class'],
      KEEP_CONTENT: true,
      RETURN_DOM: false,
      RETURN_DOM_FRAGMENT: false
    });
  } else {
    // Remover cualquier tag HTML
    sanitized = sanitized.replace(/<[^>]*>/g, '');
  }

  // 6. Escape HTML si está habilitado
  if (config.escapeHtml) {
    sanitized = validator.escape(sanitized);
  }

  // 7. Validaciones adicionales de seguridad
  if (!config.allowSpecialChars) {
    // Remover caracteres especiales peligrosos pero mantener básicos
    sanitized = sanitized.replace(/[<>'"&]/g, '');
  }

  return sanitized;
}

/**
 * Sanitiza emails de forma específica
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== 'string') return '';
  
  let sanitized = email.toLowerCase().trim();
  
  // Remover caracteres peligrosos pero mantener formato de email válido
  sanitized = sanitized.replace(/[^a-z0-9@._+-]/g, '');
  
  // Validar formato básico
  if (!validator.isEmail(sanitized)) {
    return '';
  }
  
  return sanitized;
}

/**
 * Sanitiza números
 */
export function sanitizeNumber(input: any, options: { min?: number; max?: number; integer?: boolean } = {}): number | null {
  const num = Number(input);
  
  if (isNaN(num) || !isFinite(num)) {
    return null;
  }
  
  let sanitized = num;
  
  if (options.integer) {
    sanitized = Math.floor(sanitized);
  }
  
  if (options.min !== undefined && sanitized < options.min) {
    sanitized = options.min;
  }
  
  if (options.max !== undefined && sanitized > options.max) {
    sanitized = options.max;
  }
  
  return sanitized;
}

/**
 * Sanitiza objetos recursivamente
 */
export function sanitizeObject(
  obj: any, 
  level: SanitizationLevel = SANITIZATION_LEVELS.MODERATE,
  depth: number = 0,
  maxDepth: number = 10
): any {
  // Prevenir recursión infinita
  if (depth > maxDepth) {
    return {};
  }

  if (obj === null || obj === undefined) {
    return obj;
  }

  // Arrays
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, level, depth + 1, maxDepth));
  }

  // Strings
  if (typeof obj === 'string') {
    return sanitizeString(obj, level);
  }

  // Numbers
  if (typeof obj === 'number') {
    return isFinite(obj) ? obj : 0;
  }

  // Booleans
  if (typeof obj === 'boolean') {
    return obj;
  }

  // Objects
  if (typeof obj === 'object') {
    const sanitized: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      // Sanitizar también las claves del objeto
      const sanitizedKey = sanitizeString(key, SANITIZATION_LEVELS.STRICT);
      
      // Solo procesar claves válidas
      if (sanitizedKey && sanitizedKey.length > 0) {
        sanitized[sanitizedKey] = sanitizeObject(value, level, depth + 1, maxDepth);
      }
    }
    
    return sanitized;
  }

  return obj;
}

/**
 * Sanitización específica para diferentes campos comunes
 */
export const fieldSanitizers = {
  email: (value: string) => sanitizeEmail(value),
  password: (value: string) => sanitizeString(value, SANITIZATION_LEVELS.BASIC, { maxLength: 128 }),
  name: (value: string) => sanitizeString(value, SANITIZATION_LEVELS.STRICT, { maxLength: 50 }),
  username: (value: string) => sanitizeString(value, SANITIZATION_LEVELS.STRICT, { maxLength: 30 }),
  phone: (value: string) => sanitizeString(value, SANITIZATION_LEVELS.STRICT, { maxLength: 20 }).replace(/[^\d+\-\s()]/g, ''),
  url: (value: string) => {
    const sanitized = sanitizeString(value, SANITIZATION_LEVELS.BASIC);
    return validator.isURL(sanitized) ? sanitized : '';
  },
  text: (value: string) => sanitizeString(value, SANITIZATION_LEVELS.MODERATE),
  htmlContent: (value: string) => sanitizeString(value, SANITIZATION_LEVELS.HTML_SAFE),
  searchQuery: (value: string) => sanitizeString(value, SANITIZATION_LEVELS.BASIC, { maxLength: 100 }),
  id: (value: string) => sanitizeString(value, SANITIZATION_LEVELS.STRICT, { maxLength: 50 }).replace(/[^a-zA-Z0-9\-_]/g, ''),
  slug: (value: string) => sanitizeString(value, SANITIZATION_LEVELS.STRICT, { maxLength: 100 }).toLowerCase().replace(/[^a-z0-9\-]/g, ''),
};

/**
 * Validador de tipos de archivos permitidos
 */
export function sanitizeFileType(mimetype: string, allowedTypes: string[]): boolean {
  if (!mimetype || typeof mimetype !== 'string') return false;
  
  const sanitizedMimetype = mimetype.toLowerCase().trim();
  return allowedTypes.includes(sanitizedMimetype);
}

/**
 * Sanitizador para nombres de archivos
 */
export function sanitizeFileName(filename: string): string {
  if (!filename || typeof filename !== 'string') return '';
  
  // Remover path traversal y caracteres peligrosos
  let sanitized = filename.replace(/[\/\\:*?"<>|]/g, '');
  sanitized = sanitized.replace(/\.\./g, '');
  sanitized = sanitized.trim();
  
  // Limitar longitud
  if (sanitized.length > 255) {
    const ext = sanitized.split('.').pop();
    const name = sanitized.substring(0, 255 - (ext ? ext.length + 1 : 0));
    sanitized = ext ? `${name}.${ext}` : name;
  }
  
  return sanitized;
}

/**
 * Middleware factory para sanitización automática
 */
export function createSanitizationConfig(fieldConfigs: Record<string, {
  sanitizer: keyof typeof fieldSanitizers | ((value: any) => any);
  required?: boolean;
  defaultValue?: any;
}>) {
  return fieldConfigs;
}

// Configuraciones predefinidas para diferentes contextos
export const FIELD_CONFIGS = {
  USER_REGISTRATION: createSanitizationConfig({
    email: { sanitizer: 'email', required: true },
    password: { sanitizer: 'password', required: true },
    firstName: { sanitizer: 'name', required: true },
    lastName: { sanitizer: 'name', required: true },
    phone: { sanitizer: 'phone', required: false }
  }),
  
  USER_LOGIN: createSanitizationConfig({
    email: { sanitizer: 'email', required: true },
    password: { sanitizer: 'password', required: true }
  }),
  
  USER_PROFILE_UPDATE: createSanitizationConfig({
    firstName: { sanitizer: 'name', required: false },
    lastName: { sanitizer: 'name', required: false },
    phone: { sanitizer: 'phone', required: false },
    bio: { sanitizer: 'text', required: false }
  }),
  
  SEARCH_QUERY: createSanitizationConfig({
    q: { sanitizer: 'searchQuery', required: true },
    category: { sanitizer: 'slug', required: false },
    page: { sanitizer: (value) => sanitizeNumber(value, { min: 1, integer: true }), defaultValue: 1 },
    limit: { sanitizer: (value) => sanitizeNumber(value, { min: 1, max: 100, integer: true }), defaultValue: 10 }
  })
};

export default {
  sanitizeString,
  sanitizeEmail,
  sanitizeNumber,
  sanitizeObject,
  sanitizeFileType,
  sanitizeFileName,
  fieldSanitizers,
  createSanitizationConfig,
  FIELD_CONFIGS,
  SANITIZATION_LEVELS
};
