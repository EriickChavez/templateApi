export abstract class ValueObject<T> {
  protected readonly _value: T;

  constructor(value: T) {
    this._value = Object.freeze(value);
    this.validate();
  }

  get value(): T {
    return this._value;
  }

  /**
   * Compara si dos value objects son iguales
   */
  equals(other: ValueObject<T>): boolean {
    return JSON.stringify(this._value) === JSON.stringify(other._value);
  }

  /**
   * Convierte el value object a string
   */
  toString(): string {
    return JSON.stringify(this._value);
  }

  /**
   * Convierte el value object a un objeto plano
   */
  toObject(): T {
    return this._value;
  }

  /**
   * Valida el value object
   */
  protected abstract validate(): void;
}
