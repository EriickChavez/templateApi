import { ServiceResponse } from '../types';

export abstract class BaseService {
  /**
   * Crea una respuesta exitosa del servicio
   */
  protected success<T>(data?: T, message?: string): ServiceResponse<T> {
    return {
      success: true,
      data,
      message
    };
  }

  /**
   * Crea una respuesta de error del servicio
   */
  protected failure(error: string): ServiceResponse {
    return {
      success: false,
      error
    };
  }

  /**
   * Valida que un valor no sea null o undefined
   */
  protected validateRequired(value: any, fieldName: string): void {
    if (value === null || value === undefined || value === '') {
      throw new Error(`${fieldName} es requerido`);
    }
  }

  /**
   * Valida formato de email
   */
  protected validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Valida longitud mínima de string
   */
  protected validateMinLength(value: string, minLength: number, fieldName: string): void {
    if (value.length < minLength) {
      throw new Error(`${fieldName} debe tener al menos ${minLength} caracteres`);
    }
  }
}
