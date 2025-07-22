import { Request, Response } from 'express';

// Interfaces base
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
}

// Tipos para controladores
export interface ControllerResponse<T = any> {
  status: number;
  response: ApiResponse<T>;
}

// Request personalizado con tipado
export interface CustomRequest<T = any> extends Request {
  user?: any;
  body: T;
}

// Tipos para servicios
export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Tipos para repositorios
export interface Repository<T> {
  findAll(): Promise<T[]>;
  findById(id: string): Promise<T | null>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
}

// Tipos para configuración
export interface DatabaseConfig {
  url?: string;
  type: 'mongodb' | 'postgresql' | 'mysql' | 'sqlite';
}

export interface JWTConfig {
  secret?: string;
  expiresIn: string;
}

// Tipos para middlewares
export type AsyncHandler = (req: Request, res: Response, next: Function) => Promise<void>;

// Tipos para validación
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Enum para códigos de estado HTTP
export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  INTERNAL_SERVER_ERROR = 500
}
