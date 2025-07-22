import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface EnvConfig {
  PORT: number;
  NODE_ENV: string;
  API_VERSION: string;
  DATABASE_URL?: string;
  JWT_SECRET?: string;
  CORS_ORIGIN: string;
  LOG_LEVEL: string;
}

const getEnvVar = (name: string, defaultValue?: string): string => {
  const value = process.env[name];
  if (!value && !defaultValue) {
    throw new Error(`Variable de entorno requerida no encontrada: ${name}`);
  }
  return value || defaultValue || '';
};

const getEnvNumber = (name: string, defaultValue: number): number => {
  const value = process.env[name];
  if (!value) return defaultValue;
  
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Variable de entorno ${name} debe ser un número válido`);
  }
  return parsed;
};

export const config: EnvConfig = {
  PORT: getEnvNumber('PORT', 3000),
  NODE_ENV: getEnvVar('NODE_ENV', 'development'),
  API_VERSION: getEnvVar('API_VERSION', 'v1'),
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  CORS_ORIGIN: getEnvVar('CORS_ORIGIN', '*'),
  LOG_LEVEL: getEnvVar('LOG_LEVEL', 'info')
};

// Validaciones específicas para producción
if (config.NODE_ENV === 'production') {
  if (!config.JWT_SECRET) {
    throw new Error('JWT_SECRET es requerido en producción');
  }
  if (!config.DATABASE_URL) {
    console.warn('⚠️  DATABASE_URL no está configurada en producción');
  }
}

export default config;
