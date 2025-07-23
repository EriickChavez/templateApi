import { BaseEntity } from './BaseEntity';
import { Email } from '../value-objects/Email';
import { PersonName } from '../value-objects/PersonName';
import { UserCreatedEvent } from '../events/UserCreatedEvent';
import { UserUpdatedEvent } from '../events/UserUpdatedEvent';
import { createError } from '../../middlewares/errorHandler';

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  DELETED = 'deleted'
}

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  MODERATOR = 'moderator',
  GUEST = 'guest'
}

interface UserProps {
  email: Email;
  name: PersonName;
  role: UserRole;
  status: UserStatus;
  passwordHash?: string;
  avatar?: string;
  lastLoginAt?: Date;
  isEmailVerified?: boolean;
}

export class User extends BaseEntity {
  private _email: Email;
  private _name: PersonName;
  private _role: UserRole;
  private _status: UserStatus;
  private _passwordHash?: string;
  private _avatar?: string;
  private _lastLoginAt?: Date;
  private _isEmailVerified: boolean;

  constructor(props: UserProps, id?: string) {
    super(id);
    
    this._email = props.email;
    this._name = props.name;
    this._role = props.role;
    this._status = props.status;
    this._passwordHash = props.passwordHash;
    this._avatar = props.avatar;
    this._lastLoginAt = props.lastLoginAt;
    this._isEmailVerified = props.isEmailVerified || false;

    this.validate();

    // Si es un nuevo usuario, emitir evento
    if (!id) {
      this.addDomainEvent(new UserCreatedEvent(this.id, this.version, {
        email: this._email.value,
        name: this._name.getFullName(),
        role: this._role
      }));
    }
  }

  // Getters
  get email(): Email {
    return this._email;
  }

  get name(): PersonName {
    return this._name;
  }

  get role(): UserRole {
    return this._role;
  }

  get status(): UserStatus {
    return this._status;
  }

  get avatar(): string | undefined {
    return this._avatar;
  }

  get lastLoginAt(): Date | undefined {
    return this._lastLoginAt;
  }

  get isEmailVerified(): boolean {
    return this._isEmailVerified;
  }

  get displayName(): string {
    return this._name.getFullName();
  }

  get initials(): string {
    return this._name.getInitials();
  }

  // Métodos de negocio
  
  /**
   * Actualiza el email del usuario
   */
  updateEmail(newEmail: Email): void {
    if (this._email.equals(newEmail)) {
      return; // No hay cambios
    }

    const oldEmail = this._email;
    this._email = newEmail;
    this._isEmailVerified = false; // Reset verificación
    this.markAsUpdated();

    this.addDomainEvent(new UserUpdatedEvent(this.id, this.version, {
      field: 'email',
      oldValue: oldEmail.value,
      newValue: newEmail.value
    }));
  }

  /**
   * Actualiza el nombre del usuario
   */
  updateName(newName: PersonName): void {
    if (this._name.equals(newName)) {
      return; // No hay cambios
    }

    const oldName = this._name;
    this._name = newName;
    this.markAsUpdated();

    this.addDomainEvent(new UserUpdatedEvent(this.id, this.version, {
      field: 'name',
      oldValue: oldName.getFullName(),
      newValue: newName.getFullName()
    }));
  }

  /**
   * Cambia el rol del usuario
   */
  changeRole(newRole: UserRole): void {
    if (this._role === newRole) {
      return; // No hay cambios
    }

    const oldRole = this._role;
    this._role = newRole;
    this.markAsUpdated();

    this.addDomainEvent(new UserUpdatedEvent(this.id, this.version, {
      field: 'role',
      oldValue: oldRole,
      newValue: newRole
    }));
  }

  /**
   * Activa el usuario
   */
  activate(): void {
    if (this._status === UserStatus.ACTIVE) {
      throw createError.validation('El usuario ya está activo');
    }

    this._status = UserStatus.ACTIVE;
    this.markAsUpdated();

    this.addDomainEvent(new UserUpdatedEvent(this.id, this.version, {
      field: 'status',
      oldValue: 'inactive',
      newValue: 'active'
    }));
  }

  /**
   * Desactiva el usuario
   */
  deactivate(): void {
    if (this._status === UserStatus.INACTIVE) {
      throw createError.validation('El usuario ya está inactivo');
    }

    this._status = UserStatus.INACTIVE;
    this.markAsUpdated();

    this.addDomainEvent(new UserUpdatedEvent(this.id, this.version, {
      field: 'status',
      oldValue: 'active',
      newValue: 'inactive'
    }));
  }

  /**
   * Suspende el usuario
   */
  suspend(): void {
    if (this._status === UserStatus.SUSPENDED) {
      throw createError.validation('El usuario ya está suspendido');
    }

    this._status = UserStatus.SUSPENDED;
    this.markAsUpdated();
  }

  /**
   * Marca el email como verificado
   */
  verifyEmail(): void {
    if (this._isEmailVerified) {
      return; // Ya está verificado
    }

    this._isEmailVerified = true;
    this.markAsUpdated();
  }

  /**
   * Actualiza la fecha del último login
   */
  updateLastLogin(): void {
    this._lastLoginAt = new Date();
    this.markAsUpdated();
  }

  /**
   * Actualiza el avatar
   */
  updateAvatar(avatarUrl: string): void {
    this._avatar = avatarUrl;
    this.markAsUpdated();
  }

  /**
   * Verifica si el usuario puede realizar una acción
   */
  canPerform(action: string): boolean {
    if (this._status !== UserStatus.ACTIVE) {
      return false;
    }

    switch (this._role) {
      case UserRole.ADMIN:
        return true; // Admin puede todo
      case UserRole.MODERATOR:
        return ['read', 'create', 'update', 'moderate'].includes(action);
      case UserRole.USER:
        return ['read', 'create', 'update_own'].includes(action);
      case UserRole.GUEST:
        return ['read'].includes(action);
      default:
        return false;
    }
  }

  /**
   * Verifica si es administrador
   */
  isAdmin(): boolean {
    return this._role === UserRole.ADMIN;
  }

  /**
   * Verifica si está activo
   */
  isActive(): boolean {
    return this._status === UserStatus.ACTIVE;
  }

  validate(): void {
    if (!this._email) {
      throw createError.validation('Email es requerido');
    }

    if (!this._name) {
      throw createError.validation('Nombre es requerido');
    }

    if (!Object.values(UserRole).includes(this._role)) {
      throw createError.validation('Rol inválido');
    }

    if (!Object.values(UserStatus).includes(this._status)) {
      throw createError.validation('Estado inválido');
    }
  }

  toObject(): Record<string, any> {
    return {
      id: this._id,
      email: this._email.value,
      name: {
        firstName: this._name.firstName,
        lastName: this._name.lastName,
        middleName: this._name.middleName,
        fullName: this._name.getFullName()
      },
      role: this._role,
      status: this._status,
      avatar: this._avatar,
      lastLoginAt: this._lastLoginAt?.toISOString(),
      isEmailVerified: this._isEmailVerified,
      createdAt: this._createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString(),
      version: this._version
    };
  }

  /**
   * Factory method para crear un usuario desde datos planos
   */
  static fromObject(data: any, id?: string): User {
    const email = new Email(data.email);
    const name = new PersonName({
      firstName: data.name.firstName || data.firstName,
      lastName: data.name.lastName || data.lastName,
      middleName: data.name.middleName || data.middleName
    });

    return new User({
      email,
      name,
      role: data.role || UserRole.USER,
      status: data.status || UserStatus.ACTIVE,
      passwordHash: data.passwordHash,
      avatar: data.avatar,
      lastLoginAt: data.lastLoginAt ? new Date(data.lastLoginAt) : undefined,
      isEmailVerified: data.isEmailVerified || false
    }, id);
  }
}
