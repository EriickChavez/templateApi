import { ValueObject } from './ValueObject';
import { createError } from '../../middlewares/errorHandler';

interface PersonNameProps {
  firstName: string;
  lastName: string;
  middleName?: string;
}

export class PersonName extends ValueObject<PersonNameProps> {
  constructor(props: PersonNameProps) {
    const cleanProps = {
      firstName: props.firstName?.trim(),
      lastName: props.lastName?.trim(),
      middleName: props.middleName?.trim()
    };
    super(cleanProps);
  }

  protected validate(): void {
    if (!this._value.firstName) {
      throw createError.validation('El nombre es requerido');
    }

    if (!this._value.lastName) {
      throw createError.validation('El apellido es requerido');
    }

    if (this._value.firstName.length < 2) {
      throw createError.validation('El nombre debe tener al menos 2 caracteres');
    }

    if (this._value.lastName.length < 2) {
      throw createError.validation('El apellido debe tener al menos 2 caracteres');
    }

    if (this._value.firstName.length > 50) {
      throw createError.validation('El nombre no puede exceder 50 caracteres');
    }

    if (this._value.lastName.length > 50) {
      throw createError.validation('El apellido no puede exceder 50 caracteres');
    }

    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    
    if (!nameRegex.test(this._value.firstName)) {
      throw createError.validation('El nombre solo puede contener letras y espacios');
    }

    if (!nameRegex.test(this._value.lastName)) {
      throw createError.validation('El apellido solo puede contener letras y espacios');
    }

    if (this._value.middleName && !nameRegex.test(this._value.middleName)) {
      throw createError.validation('El segundo nombre solo puede contener letras y espacios');
    }
  }

  get firstName(): string {
    return this._value.firstName;
  }

  get lastName(): string {
    return this._value.lastName;
  }

  get middleName(): string | undefined {
    return this._value.middleName;
  }

  /**
   * Obtiene el nombre completo
   */
  getFullName(): string {
    const parts = [
      this._value.firstName,
      this._value.middleName,
      this._value.lastName
    ].filter(Boolean);
    
    return parts.join(' ');
  }

  /**
   * Obtiene las iniciales
   */
  getInitials(): string {
    const firstInitial = this._value.firstName.charAt(0).toUpperCase();
    const lastInitial = this._value.lastName.charAt(0).toUpperCase();
    return `${firstInitial}${lastInitial}`;
  }

  /**
   * Obtiene el nombre en formato apellido, nombre
   */
  getLastNameFirst(): string {
    return `${this._value.lastName}, ${this._value.firstName}`;
  }
}
