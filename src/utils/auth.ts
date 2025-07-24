import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { UserRole } from '../domain/entities/User';

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface AuthResult {
  success: boolean;
  token?: string;
  user?: any;
  message?: string;
  error?: string;
}

export class AuthUtils {
  /**
   * Encripta una contraseña
   */
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  /**
   * Compara una contraseña con su hash
   */
  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  /**
   * Genera un JWT token
   */
  static generateToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
    if (!config.JWT_SECRET) {
      throw new Error('JWT_SECRET no está configurado');
    }

    return jwt.sign(payload, config.JWT_SECRET, {
      expiresIn: '24h',
      issuer: 'templateapi',
      audience: 'templateapi-client'
    });
  }

  /**
   * Verifica un JWT token
   */
  static verifyToken(token: string): TokenPayload {
    if (!config.JWT_SECRET) {
      throw new Error('JWT_SECRET no está configurado');
    }

    try {
      const decoded = jwt.verify(token, config.JWT_SECRET, {
        issuer: 'templateapi',
        audience: 'templateapi-client'
      }) as TokenPayload;

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token expirado');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Token inválido');
      }
      throw new Error('Error al verificar token');
    }
  }

  /**
   * Extrae token del header Authorization
   */
  static extractTokenFromHeader(authHeader: string | undefined): string {
    if (!authHeader) {
      throw new Error('Header Authorization no proporcionado');
    }

    const parts = authHeader.split(' ');
    
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new Error('Formato de token inválido. Use: Bearer <token>');
    }

    return parts[1];
  }

  /**
   * Genera un token de refresh
   */
  static generateRefreshToken(userId: string): string {
    if (!config.JWT_SECRET) {
      throw new Error('JWT_SECRET no está configurado');
    }

    return jwt.sign({ userId, type: 'refresh' }, config.JWT_SECRET, {
      expiresIn: '7d',
      issuer: 'templateapi'
    });
  }

  /**
   * Valida la fortaleza de una contraseña
   */
  static validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('La contraseña debe tener al menos 8 caracteres');
    }

    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('La contraseña debe contener al menos una letra minúscula');
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('La contraseña debe contener al menos una letra mayúscula');
    }

    if (!/(?=.*\d)/.test(password)) {
      errors.push('La contraseña debe contener al menos un número');
    }

    if (!/(?=.*[@$!%*?&])/.test(password)) {
      errors.push('La contraseña debe contener al menos un carácter especial (@$!%*?&)');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Genera un código aleatorio (para verificación por email, etc.)
   */
  static generateRandomCode(length: number = 6): string {
    const characters = '0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    return result;
  }

  /**
   * Sanitiza datos de entrada para evitar XSS
   */
  static sanitizeInput(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remover < >
      .replace(/javascript:/gi, '') // Remover javascript:
      .replace(/on\w+=/gi, '') // Remover event handlers
      .trim();
  }
}
