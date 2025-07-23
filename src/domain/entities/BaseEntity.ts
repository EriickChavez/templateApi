import { DomainEvent } from '../events/DomainEvent';

export abstract class BaseEntity {
  protected _id: string;
  protected _createdAt: Date;
  protected _updatedAt: Date;
  protected _version: number;
  private _domainEvents: DomainEvent[] = [];

  constructor(id?: string) {
    this._id = id || this.generateId();
    this._createdAt = new Date();
    this._updatedAt = new Date();
    this._version = 1;
  }

  get id(): string {
    return this._id;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get version(): number {
    return this._version;
  }

  /**
   * Marca la entidad como actualizada
   */
  protected markAsUpdated(): void {
    this._updatedAt = new Date();
    this._version++;
  }

  /**
   * Agrega un evento de dominio
   */
  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  /**
   * Obtiene todos los eventos de dominio
   */
  getDomainEvents(): DomainEvent[] {
    return [...this._domainEvents];
  }

  /**
   * Limpia los eventos de dominio
   */
  clearDomainEvents(): void {
    this._domainEvents = [];
  }

  /**
   * Genera un ID único
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Compara si dos entidades son iguales
   */
  equals(entity: BaseEntity): boolean {
    return this._id === entity._id;
  }

  /**
   * Convierte la entidad a un objeto plano
   */
  abstract toObject(): Record<string, any>;

  /**
   * Valida la entidad
   */
  abstract validate(): void;
}
