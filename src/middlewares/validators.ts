import { body, param, query, ValidationChain, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { ResponseUtil } from '../utils/response';
import validator from 'validator';
import { AuthUtils } from '../utils/auth';

/**
 * Middleware para manejar errores de validación
 */
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    ResponseUtil.validationError(res, errorMessages);
    return;
  }
  
  next();
};

/**
 * Validadores para autenticación
 */
export const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email debe ser válido'),
  
  body('password')
    .isLength({ min: 1 })
    .withMessage('Password es requerido')
    .custom((value) => {
      // Sanitizar input
      const sanitized = AuthUtils.sanitizeInput(value);
      if (sanitized !== value) {
        throw new Error('Password contiene caracteres no permitidos');
      }
      return true;
    }),
  
  handleValidationErrors
];

export const validateRegister = [
  body('name')
    .isLength({ min: 2, max: 50 })
    .withMessage('Nombre debe tener entre 2 y 50 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('Nombre solo puede contener letras y espacios')
    .custom((value) => {
      return AuthUtils.sanitizeInput(value);
    }),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email debe ser válido')
    .custom(async (value) => {
      // Aquí validarías si el email ya existe en la DB
      // const existingUser = await UserRepository.findByEmail(value);
      // if (existingUser) {
      //   throw new Error('Email ya está registrado');
      // }
      return true;
    }),
  
  body('password')
    .custom((value) => {
      const validation = AuthUtils.validatePasswordStrength(value);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }
      return true;
    }),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Las contraseñas no coinciden');
      }
      return true;
    }),
  
  handleValidationErrors
];

/**
 * Validadores para parámetros de URL
 */
export const validateUserId = [
  param('userId')
    .isUUID()
    .withMessage('ID de usuario debe ser un UUID válido'),
  
  handleValidationErrors
];

export const validateObjectId = [
  param('id')
    .isMongoId()
    .withMessage('ID debe ser un ObjectId válido'),
  
  handleValidationErrors
];

/**
 * Validadores para query parameters
 */
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Página debe ser un número entero entre 1 y 1000'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Límite debe ser un número entero entre 1 y 100'),
  
  query('sort')
    .optional()
    .matches(/^[a-zA-Z_]+:(asc|desc)$/)
    .withMessage('Sort debe tener formato field:asc o field:desc'),
  
  handleValidationErrors
];

/**
 * Validador genérico para nombres
 */
export const validateName = [
  param('nombre')
    .isLength({ min: 1, max: 50 })
    .withMessage('Nombre debe tener entre 1 y 50 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('Nombre solo puede contener letras y espacios')
    .custom((value) => {
      const sanitized = AuthUtils.sanitizeInput(value);
      if (sanitized.length === 0) {
        throw new Error('Nombre no puede estar vacío después de sanitización');
      }
      return true;
    }),
  
  handleValidationErrors
];

/**
 * Validador para archivos (si implementas upload)
 */
export const validateFileUpload = [
  body('file')
    .custom((value, { req }) => {
      if (!req.file) {
        throw new Error('Archivo es requerido');
      }
      
      // Validar tipo de archivo
      const allowedMimes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedMimes.includes(req.file.mimetype)) {
        throw new Error('Tipo de archivo no permitido. Solo JPEG, PNG y GIF');
      }
      
      // Validar tamaño (5MB max)
      const maxSize = 5 * 1024 * 1024;
      if (req.file.size > maxSize) {
        throw new Error('Archivo muy grande. Máximo 5MB');
      }
      
      return true;
    }),
  
  handleValidationErrors
];

/**
 * Validador para datos de perfil de usuario
 */
export const validateUserProfile = [
  body('name')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Nombre debe tener entre 2 y 50 caracteres'),
  
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Email debe ser válido'),
  
  body('phone')
    .optional()
    .isMobilePhone('es-MX')
    .withMessage('Teléfono debe ser válido'),
  
  body('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Biografía no puede exceder 500 caracteres'),
  
  handleValidationErrors
];

/**
 * Sanitizador de datos de entrada
 */
export const sanitizeInput = (req: Request, res: Response, next: NextFunction): void => {
  // Sanitizar todos los strings en el body
  if (req.body && typeof req.body === 'object') {
    for (const [key, value] of Object.entries(req.body)) {
      if (typeof value === 'string') {
        req.body[key] = validator.escape(value.trim());
      }
    }
  }
  
  // Sanitizar parámetros de query
  if (req.query && typeof req.query === 'object') {
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === 'string') {
        req.query[key] = validator.escape(value.trim());
      }
    }
  }
  
  next();
};
