import { 
  IsEmail, 
  IsString, 
  IsOptional, 
  MinLength, 
  IsEnum, 
  Matches,
  IsUUID,
  IsDateString
} from 'class-validator';
import { Exclude, Expose, Transform } from 'class-transformer';
import { PaginationDto } from './BaseDto';

// Enum para roles
export enum UserRole {
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  USER = 'user',
  GUEST = 'guest'
}

// DTO para crear usuario
export class CreateUserDto {
  @IsEmail({}, { message: 'Debe ser un email válido' })
  email!: string;

  @IsString({ message: 'Password debe ser un string' })
  @MinLength(8, { message: 'Password debe tener al menos 8 caracteres' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    { message: 'Password debe contener al menos: 1 mayúscula, 1 minúscula, 1 número y 1 carácter especial' }
  )
  password!: string;

  @IsString({ message: 'Nombre debe ser un string' })
  @MinLength(2, { message: 'Nombre debe tener al menos 2 caracteres' })
  firstName!: string;

  @IsString({ message: 'Apellido debe ser un string' })
  @MinLength(2, { message: 'Apellido debe tener al menos 2 caracteres' })
  lastName!: string;

  @IsOptional()
  @IsEnum(UserRole, { message: 'Rol debe ser admin, moderator, user o guest' })
  role?: UserRole = UserRole.USER;
}

// DTO para actualizar usuario
export class UpdateUserDto {
  @IsOptional()
  @IsEmail({}, { message: 'Debe ser un email válido' })
  email?: string;

  @IsOptional()
  @IsString({ message: 'Nombre debe ser un string' })
  @MinLength(2, { message: 'Nombre debe tener al menos 2 caracteres' })
  firstName?: string;

  @IsOptional()
  @IsString({ message: 'Apellido debe ser un string' })
  @MinLength(2, { message: 'Apellido debe tener al menos 2 caracteres' })
  lastName?: string;

  @IsOptional()
  @IsEnum(UserRole, { message: 'Rol debe ser admin, moderator, user o guest' })
  role?: UserRole;
}

// DTO para login
export class LoginDto {
  @IsEmail({}, { message: 'Debe ser un email válido' })
  email!: string;

  @IsString({ message: 'Password es requerido' })
  password!: string;
}

// DTO para cambiar password
export class ChangePasswordDto {
  @IsString({ message: 'Password actual es requerido' })
  currentPassword!: string;

  @IsString({ message: 'Nuevo password debe ser un string' })
  @MinLength(8, { message: 'Nuevo password debe tener al menos 8 caracteres' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    { message: 'Nuevo password debe contener al menos: 1 mayúscula, 1 minúscula, 1 número y 1 carácter especial' }
  )
  newPassword!: string;
}

// DTO para filtrar usuarios (con paginación)
export class FilterUsersDto extends PaginationDto {
  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsDateString()
  createdAfter?: string;

  @IsOptional()
  @IsDateString()
  createdBefore?: string;
}

// DTO de respuesta para usuario (sin password)
export class UserResponseDto {
  @Expose()
  id!: string;

  @Expose()
  email!: string;

  @Expose()
  firstName!: string;

  @Expose()
  lastName!: string;

  @Expose()
  @Transform(({ value }) => value || UserRole.USER)
  role!: UserRole;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;

  @Expose()
  @Transform(({ obj }) => `${obj.firstName} ${obj.lastName}`)
  fullName!: string;

  @Exclude()
  password?: string;

  @Exclude()
  passwordHash?: string;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}

// DTO para respuesta de login
export class LoginResponseDto {
  @Expose()
  user!: UserResponseDto;

  @Expose()
  token!: string;

  @Expose()
  expiresIn!: string;

  @Expose()
  tokenType: string = 'Bearer';

  constructor(user: UserResponseDto, token: string, expiresIn: string) {
    this.user = user;
    this.token = token;
    this.expiresIn = expiresIn;
  }
}

// DTO para parámetros de ruta
export class UserParamsDto {
  @IsUUID('4', { message: 'ID debe ser un UUID válido' })
  id!: string;
}
