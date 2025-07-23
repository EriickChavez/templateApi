import { User } from '../entities/User';
import { Email } from '../value-objects/Email';

export interface UserRepository {
  /**
   * Guarda un usuario
   */
  save(user: User): Promise<User>;

  /**
   * Busca un usuario por ID
   */
  findById(id: string): Promise<User | null>;

  /**
   * Busca un usuario por email
   */
  findByEmail(email: Email): Promise<User | null>;

  /**
   * Busca usuarios por rol
   */
  findByRole(role: string): Promise<User[]>;

  /**
   * Busca todos los usuarios activos
   */
  findAllActive(): Promise<User[]>;

  /**
   * Busca todos los usuarios
   */
  findAll(limit?: number, offset?: number): Promise<User[]>;

  /**
   * Busca usuarios por nombre (búsqueda parcial)
   */
  findByNameContains(nameSearchTerm: string): Promise<User[]>;

  /**
   * Cuenta el total de usuarios
   */
  count(): Promise<number>;

  /**
   * Cuenta usuarios por estado
   */
  countByStatus(status: string): Promise<number>;

  /**
   * Actualiza un usuario
   */
  update(user: User): Promise<User>;

  /**
   * Elimina un usuario (soft delete)
   */
  delete(id: string): Promise<boolean>;

  /**
   * Elimina permanentemente un usuario
   */
  hardDelete(id: string): Promise<boolean>;

  /**
   * Verifica si existe un usuario con el email dado
   */
  existsByEmail(email: Email): Promise<boolean>;

  /**
   * Obtiene usuarios creados en un rango de fechas
   */
  findByDateRange(startDate: Date, endDate: Date): Promise<User[]>;
}
