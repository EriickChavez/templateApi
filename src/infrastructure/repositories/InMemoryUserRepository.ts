import { User } from '../../domain/entities/User';
import { Email } from '../../domain/value-objects/Email';
import { UserRepository } from '../../domain/repositories/UserRepository';

export class InMemoryUserRepository implements UserRepository {
  private users: Map<string, User> = new Map();

  async save(user: User): Promise<User> {
    this.users.set(user.id, user);
    return user;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async findByEmail(email: Email): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email.equals(email)) {
        return user;
      }
    }
    return null;
  }

  async findByRole(role: string): Promise<User[]> {
    const result: User[] = [];
    for (const user of this.users.values()) {
      if (user.role === role) {
        result.push(user);
      }
    }
    return result;
  }

  async findAllActive(): Promise<User[]> {
    const result: User[] = [];
    for (const user of this.users.values()) {
      if (user.isActive()) {
        result.push(user);
      }
    }
    return result;
  }

  async findAll(limit?: number, offset?: number): Promise<User[]> {
    const allUsers = Array.from(this.users.values());
    
    if (offset) {
      allUsers.splice(0, offset);
    }
    
    if (limit) {
      return allUsers.slice(0, limit);
    }
    
    return allUsers;
  }

  async findByNameContains(nameSearchTerm: string): Promise<User[]> {
    const result: User[] = [];
    const searchTerm = nameSearchTerm.toLowerCase();
    
    for (const user of this.users.values()) {
      const fullName = user.displayName.toLowerCase();
      if (fullName.includes(searchTerm)) {
        result.push(user);
      }
    }
    
    return result;
  }

  async count(): Promise<number> {
    return this.users.size;
  }

  async countByStatus(status: string): Promise<number> {
    let count = 0;
    for (const user of this.users.values()) {
      if (user.status === status) {
        count++;
      }
    }
    return count;
  }

  async update(user: User): Promise<User> {
    this.users.set(user.id, user);
    return user;
  }

  async delete(id: string): Promise<boolean> {
    const user = this.users.get(id);
    if (user) {
      // En este caso, marcamos como soft delete cambiando el estado
      user.deactivate();
      this.users.set(id, user);
      return true;
    }
    return false;
  }

  async hardDelete(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  async existsByEmail(email: Email): Promise<boolean> {
    const user = await this.findByEmail(email);
    return user !== null;
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<User[]> {
    const result: User[] = [];
    
    for (const user of this.users.values()) {
      if (user.createdAt >= startDate && user.createdAt <= endDate) {
        result.push(user);
      }
    }
    
    return result;
  }

  // Métodos adicionales para testing
  
  /**
   * Limpia todos los usuarios (útil para tests)
   */
  async clear(): Promise<void> {
    this.users.clear();
  }

  /**
   * Obtiene la cantidad total de usuarios en memoria
   */
  size(): number {
    return this.users.size;
  }

  /**
   * Obtiene todos los usuarios como array (útil para debugging)
   */
  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }
}
