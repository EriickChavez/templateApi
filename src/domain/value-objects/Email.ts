import { ValueObject } from './ValueObject';
import { createError } from '../../middlewares/errorHandler';

export class Email extends ValueObject<string> {
  constructor(email: string) {
    super(email.toLowerCase().trim());
  }

  protected validate(): void {
    if (!this._value) {
      throw createError.validation('El email es requerido');
    }

    if (this._value.length < 5) {
      throw createError.validation('El email debe tener al menos 5 caracteres');
    }

    if (this._value.length > 254) {
      throw createError.validation('El email no puede exceder 254 caracteres');
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(this._value)) {
      throw createError.validation('Formato de email inválido');
    }
  }

  /**
   * Obtiene el dominio del email
   */
  getDomain(): string {
    return this._value.split('@')[1];
  }

  /**
   * Obtiene la parte local del email (antes del @)
   */
  getLocalPart(): string {
    return this._value.split('@')[0];
  }

  /**
   * Verifica si es un email corporativo
   */
  isCorporate(): boolean {
    const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
    return !personalDomains.includes(this.getDomain());
  }
}
