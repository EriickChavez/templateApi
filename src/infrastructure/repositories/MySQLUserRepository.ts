import { v4 as uuidv4 } from 'uuid';
import { UserRepository } from '../../domain/repositories/UserRepository';
import { User, UserRole, UserStatus } from '../../domain/entities/User';
import { Email } from '../../domain/value-objects/Email';
import { PersonName } from '../../domain/value-objects/PersonName';
import { mysqlConnection, QueryResult } from '../database/mysql/connection';

interface UserRow extends QueryResult {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  role: UserRole;
  status: UserStatus;
  password_hash: string;
  avatar?: string;
  last_login_at?: Date;
  is_email_verified: boolean;
  login_attempts: number;
  lock_until?: Date;
  version: number;
  created_at: Date;
  updated_at: Date;
}

export class MySQLUserRepository implements UserRepository {
  
  /**
   * Convierte una fila de MySQL a entidad de dominio
   */
  private toEntity(row: UserRow): User {
    const email = new Email(row.email);
    const name = new PersonName({
      firstName: row.first_name,
      lastName: row.last_name,
      middleName: row.middle_name
    });

    const user = new User({
      email,
      name,
      role: row.role,
      status: row.status,
      passwordHash: row.password_hash,
      avatar: row.avatar,
      lastLoginAt: row.last_login_at,
      isEmailVerified: row.is_email_verified
    }, row.id);

    // Establecer fechas y versión manualmente
    (user as any)._createdAt = row.created_at;
    (user as any)._updatedAt = row.updated_at;
    (user as any)._version = row.version;

    return user;
  }

  /**
   * Convierte una entidad de dominio a datos para MySQL
   */
  private toRowData(user: User) {
    return {
      id: user.id || uuidv4(),
      email: user.email.value,
      first_name: user.name.firstName,
      last_name: user.name.lastName,
      middle_name: user.name.middleName || null,
      role: user.role,
      status: user.status,
      password_hash: (user as any)._passwordHash,
      avatar: user.avatar || null,
      last_login_at: user.lastLoginAt || null,
      is_email_verified: user.isEmailVerified,
      version: user.version
    };
  }

  async save(user: User): Promise<User> {
    try {
      const userData = this.toRowData(user);
      
      if (user.id) {
        // Actualizar usuario existente
        const query = `
          UPDATE users 
          SET email = ?, first_name = ?, last_name = ?, middle_name = ?, 
              role = ?, status = ?, password_hash = ?, avatar = ?, 
              last_login_at = ?, is_email_verified = ?, version = version + 1,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `;
        
        const params = [
          userData.email, userData.first_name, userData.last_name, userData.middle_name,
          userData.role, userData.status, userData.password_hash, userData.avatar,
          userData.last_login_at, userData.is_email_verified, user.id
        ];
        
        const result = await mysqlConnection.execute(query, params);
        
        if ((result as any).affectedRows === 0) {
          throw new Error('Usuario no encontrado para actualizar');
        }
        
        // Obtener el usuario actualizado
        return await this.findById(user.id) as User;
        
      } else {
        // Crear nuevo usuario
        const query = `
          INSERT INTO users (
            id, email, first_name, last_name, middle_name, role, status, 
            password_hash, avatar, last_login_at, is_email_verified, version
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const params = [
          userData.id, userData.email, userData.first_name, userData.last_name, 
          userData.middle_name, userData.role, userData.status, userData.password_hash,
          userData.avatar, userData.last_login_at, userData.is_email_verified, userData.version
        ];
        
        await mysqlConnection.execute(query, params);
        
        // Obtener el usuario creado
        return await this.findById(userData.id) as User;
      }
      
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('El email ya está registrado');
      }
      throw new Error(`Error al guardar usuario: ${error.message}`);
    }
  }

  async findById(id: string): Promise<User | null> {
    try {
      const query = 'SELECT * FROM users WHERE id = ?';
      const rows = await mysqlConnection.execute(query, [id]) as UserRow[];
      
      return rows.length > 0 ? this.toEntity(rows[0]) : null;
    } catch (error) {
      console.error('Error al buscar usuario por ID:', error);
      return null;
    }
  }

  async findByEmail(email: Email): Promise<User | null> {
    try {
      const query = 'SELECT * FROM users WHERE email = ?';
      const rows = await mysqlConnection.execute(query, [email.value]) as UserRow[];
      
      return rows.length > 0 ? this.toEntity(rows[0]) : null;
    } catch (error) {
      console.error('Error al buscar usuario por email:', error);
      return null;
    }
  }

  async findByRole(role: string): Promise<User[]> {
    try {
      const query = 'SELECT * FROM users WHERE role = ?';
      const rows = await mysqlConnection.execute(query, [role]) as UserRow[];
      
      return rows.map(row => this.toEntity(row));
    } catch (error) {
      console.error('Error al buscar usuarios por rol:', error);
      return [];
    }
  }

  async findAllActive(): Promise<User[]> {
    try {
      const query = 'SELECT * FROM users WHERE status = ? ORDER BY created_at DESC';
      const rows = await mysqlConnection.execute(query, [UserStatus.ACTIVE]) as UserRow[];
      
      return rows.map(row => this.toEntity(row));
    } catch (error) {
      console.error('Error al buscar usuarios activos:', error);
      return [];
    }
  }

  async findAll(limit?: number, offset?: number): Promise<User[]> {
    try {
      let query = 'SELECT * FROM users ORDER BY created_at DESC';
      const params: any[] = [];
      
      if (limit) {
        query += ' LIMIT ?';
        params.push(limit);
        
        if (offset) {
          query += ' OFFSET ?';
          params.push(offset);
        }
      }
      
      const rows = await mysqlConnection.execute(query, params) as UserRow[];
      return rows.map(row => this.toEntity(row));
    } catch (error) {
      console.error('Error al buscar todos los usuarios:', error);
      return [];
    }
  }

  async findByNameContains(nameSearchTerm: string): Promise<User[]> {
    try {
      const searchPattern = `%${nameSearchTerm}%`;
      const query = `
        SELECT * FROM users 
        WHERE first_name LIKE ? OR last_name LIKE ? OR middle_name LIKE ?
        ORDER BY created_at DESC
      `;
      
      const rows = await mysqlConnection.execute(query, [
        searchPattern, searchPattern, searchPattern
      ]) as UserRow[];
      
      return rows.map(row => this.toEntity(row));
    } catch (error) {
      console.error('Error al buscar usuarios por nombre:', error);
      return [];
    }
  }

  async count(): Promise<number> {
    try {
      const query = 'SELECT COUNT(*) as count FROM users';
      const rows = await mysqlConnection.execute(query) as { count: number }[];
      
      return rows[0]?.count || 0;
    } catch (error) {
      console.error('Error al contar usuarios:', error);
      return 0;
    }
  }

  async countByStatus(status: string): Promise<number> {
    try {
      const query = 'SELECT COUNT(*) as count FROM users WHERE status = ?';
      const rows = await mysqlConnection.execute(query, [status]) as { count: number }[];
      
      return rows[0]?.count || 0;
    } catch (error) {
      console.error('Error al contar usuarios por estado:', error);
      return 0;
    }
  }

  async update(user: User): Promise<User> {
    return await this.save(user);
  }

  async delete(id: string): Promise<boolean> {
    try {
      // Soft delete - cambiar estado a DELETED
      const query = 'UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
      const result = await mysqlConnection.execute(query, [UserStatus.DELETED, id]);
      
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      return false;
    }
  }

  async hardDelete(id: string): Promise<boolean> {
    try {
      const query = 'DELETE FROM users WHERE id = ?';
      const result = await mysqlConnection.execute(query, [id]);
      
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error('Error al eliminar usuario permanentemente:', error);
      return false;
    }
  }

  async existsByEmail(email: Email): Promise<boolean> {
    try {
      const query = 'SELECT COUNT(*) as count FROM users WHERE email = ?';
      const rows = await mysqlConnection.execute(query, [email.value]) as { count: number }[];
      
      return (rows[0]?.count || 0) > 0;
    } catch (error) {
      console.error('Error al verificar existencia de email:', error);
      return false;
    }
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<User[]> {
    try {
      const query = `
        SELECT * FROM users 
        WHERE created_at >= ? AND created_at <= ?
        ORDER BY created_at DESC
      `;
      
      const rows = await mysqlConnection.execute(query, [startDate, endDate]) as UserRow[];
      return rows.map(row => this.toEntity(row));
    } catch (error) {
      console.error('Error al buscar usuarios por rango de fechas:', error);
      return [];
    }
  }

  // Métodos específicos de MySQL

  /**
   * Buscar administradores activos
   */
  async findAdmins(): Promise<User[]> {
    try {
      const query = `
        SELECT * FROM users 
        WHERE role = ? AND status = ?
        ORDER BY created_at DESC
      `;
      
      const rows = await mysqlConnection.execute(query, [
        UserRole.ADMIN, UserStatus.ACTIVE
      ]) as UserRow[];
      
      return rows.map(row => this.toEntity(row));
    } catch (error) {
      console.error('Error al buscar administradores:', error);
      return [];
    }
  }

  /**
   * Actualizar último login
   */
  async updateLastLogin(userId: string): Promise<boolean> {
    try {
      const query = `
        UPDATE users 
        SET last_login_at = CURRENT_TIMESTAMP, 
            login_attempts = 0, 
            lock_until = NULL,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      
      const result = await mysqlConnection.execute(query, [userId]);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error('Error al actualizar último login:', error);
      return false;
    }
  }

  /**
   * Incrementar intentos de login fallidos
   */
  async incrementLoginAttempts(email: string): Promise<boolean> {
    try {
      const maxAttempts = 5;
      const lockTime = 2 * 60 * 60 * 1000; // 2 horas en milisegundos
      
      // Buscar usuario actual
      const user = await this.findByEmail(new Email(email));
      if (!user) return false;
      
      const newAttempts = ((user as any).loginAttempts || 0) + 1;
      
      let query: string;
      let params: any[];
      
      if (newAttempts >= maxAttempts) {
        // Bloquear usuario
        const lockUntil = new Date(Date.now() + lockTime);
        query = `
          UPDATE users 
          SET login_attempts = ?, lock_until = ?, updated_at = CURRENT_TIMESTAMP
          WHERE email = ?
        `;
        params = [newAttempts, lockUntil, email];
      } else {
        // Solo incrementar intentos
        query = `
          UPDATE users 
          SET login_attempts = ?, updated_at = CURRENT_TIMESTAMP
          WHERE email = ?
        `;
        params = [newAttempts, email];
      }
      
      const result = await mysqlConnection.execute(query, params);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error('Error al incrementar intentos de login:', error);
      return false;
    }
  }

  /**
   * Verificar si un usuario está bloqueado
   */
  async isUserLocked(email: string): Promise<boolean> {
    try {
      const query = `
        SELECT lock_until 
        FROM users 
        WHERE email = ? AND lock_until > CURRENT_TIMESTAMP
      `;
      
      const rows = await mysqlConnection.execute(query, [email]) as { lock_until: Date }[];
      return rows.length > 0;
    } catch (error) {
      console.error('Error al verificar bloqueo de usuario:', error);
      return false;
    }
  }

  /**
   * Cambiar contraseña de usuario
   */
  async changePassword(userId: string, newPasswordHash: string): Promise<boolean> {
    try {
      const query = `
        UPDATE users 
        SET password_hash = ?, version = version + 1, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      
      const result = await mysqlConnection.execute(query, [newPasswordHash, userId]);
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      return false;
    }
  }

  /**
   * Estadísticas de usuarios
   */
  async getUserStats() {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_users,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_users,
          SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admin_users,
          SUM(CASE WHEN role = 'moderator' THEN 1 ELSE 0 END) as moderator_users,
          SUM(CASE WHEN role = 'user' THEN 1 ELSE 0 END) as regular_users,
          SUM(CASE WHEN is_email_verified = 1 THEN 1 ELSE 0 END) as verified_users
        FROM users
      `;
      
      const rows = await mysqlConnection.execute(query) as any[];
      const stats = rows[0];
      
      return {
        totalUsers: parseInt(stats.total_users) || 0,
        activeUsers: parseInt(stats.active_users) || 0,
        adminUsers: parseInt(stats.admin_users) || 0,
        moderatorUsers: parseInt(stats.moderator_users) || 0,
        regularUsers: parseInt(stats.regular_users) || 0,
        verifiedUsers: parseInt(stats.verified_users) || 0
      };
    } catch (error) {
      console.error('Error al obtener estadísticas de usuarios:', error);
      return {
        totalUsers: 0,
        activeUsers: 0,
        adminUsers: 0,
        moderatorUsers: 0,
        regularUsers: 0,
        verifiedUsers: 0
      };
    }
  }

  /**
   * Buscar usuarios con paginación avanzada
   */
  async findWithPagination(page: number = 1, limit: number = 10, filters?: {
    role?: UserRole;
    status?: UserStatus;
    search?: string;
  }) {
    try {
      const offset = (page - 1) * limit;
      let whereConditions: string[] = [];
      let params: any[] = [];
      
      if (filters?.role) {
        whereConditions.push('role = ?');
        params.push(filters.role);
      }
      
      if (filters?.status) {
        whereConditions.push('status = ?');
        params.push(filters.status);
      }
      
      if (filters?.search) {
        whereConditions.push('(first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)');
        const searchPattern = `%${filters.search}%`;
        params.push(searchPattern, searchPattern, searchPattern);
      }
      
      const whereClause = whereConditions.length > 0 
        ? `WHERE ${whereConditions.join(' AND ')}` 
        : '';
      
      // Query para obtener usuarios
      const usersQuery = `
        SELECT * FROM users 
        ${whereClause}
        ORDER BY created_at DESC 
        LIMIT ? OFFSET ?
      `;
      
      // Query para contar total
      const countQuery = `
        SELECT COUNT(*) as total FROM users 
        ${whereClause}
      `;
      
      const usersParams = [...params, limit, offset];
      const countParams = [...params];
      
      const [users, count] = await Promise.all([
        mysqlConnection.execute(usersQuery, usersParams) as Promise<UserRow[]>,
        mysqlConnection.execute(countQuery, countParams) as Promise<{ total: number }[]>
      ]);
      
      return {
        users: users.map(row => this.toEntity(row)),
        pagination: {
          page,
          limit,
          total: count[0]?.total || 0,
          totalPages: Math.ceil((count[0]?.total || 0) / limit)
        }
      };
    } catch (error) {
      console.error('Error en paginación de usuarios:', error);
      return {
        users: [],
        pagination: { page, limit, total: 0, totalPages: 0 }
      };
    }
  }

  /**
   * Limpiar base de datos (solo para testing)
   */
  async clear(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('No se puede limpiar la base de datos en producción');
    }
    
    await mysqlConnection.execute('DELETE FROM users');
  }
}
