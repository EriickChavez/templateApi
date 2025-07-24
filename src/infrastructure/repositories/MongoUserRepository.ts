import { UserRepository } from '../../domain/repositories/UserRepository';
import { User, UserRole, UserStatus } from '../../domain/entities/User';
import { Email } from '../../domain/value-objects/Email';
import { PersonName } from '../../domain/value-objects/PersonName';
import { UserModel, IUserDocument } from '../database/mongodb/models/UserModel';
import { AuthUtils } from '../../utils/auth';

export class MongoUserRepository implements UserRepository {
  
  /**
   * Convierte un documento de MongoDB a entidad de dominio
   */
  private toEntity(doc: IUserDocument): User {
    const email = new Email(doc.email);
    const name = new PersonName({
      firstName: doc.firstName,
      lastName: doc.lastName,
      middleName: doc.middleName
    });

    const user = new User({
      email,
      name,
      role: doc.role,
      status: doc.status,
      passwordHash: doc.passwordHash,
      avatar: doc.avatar,
      lastLoginAt: doc.lastLoginAt,
      isEmailVerified: doc.isEmailVerified
    }, doc._id.toString());

    // Establecer fechas y versión manualmente
    (user as any)._createdAt = doc.createdAt;
    (user as any)._updatedAt = doc.updatedAt;
    (user as any)._version = doc.version;

    return user;
  }

  /**
   * Convierte una entidad de dominio a documento de MongoDB
   */
  private toDocument(user: User): Partial<IUserDocument> {
    return {
      email: user.email.value,
      firstName: user.name.firstName,
      lastName: user.name.lastName,
      middleName: user.name.middleName,
      role: user.role,
      status: user.status,
      passwordHash: (user as any)._passwordHash,
      avatar: user.avatar,
      lastLoginAt: user.lastLoginAt,
      isEmailVerified: user.isEmailVerified,
      version: user.version
    };
  }

  async save(user: User): Promise<User> {
    try {
      const userData = this.toDocument(user);
      
      if (user.id) {
        // Actualizar usuario existente
        const doc = await UserModel.findByIdAndUpdate(
          user.id, 
          userData, 
          { new: true, runValidators: true }
        );
        
        if (!doc) {
          throw new Error('Usuario no encontrado para actualizar');
        }
        
        return this.toEntity(doc);
      } else {
        // Crear nuevo usuario
        const doc = new UserModel(userData);
        const savedDoc = await doc.save();
        return this.toEntity(savedDoc);
      }
    } catch (error: any) {
      if (error.code === 11000) {
        throw new Error('El email ya está registrado');
      }
      throw new Error(`Error al guardar usuario: ${error.message}`);
    }
  }

  async findById(id: string): Promise<User | null> {
    try {
      const doc = await UserModel.findById(id);
      return doc ? this.toEntity(doc) : null;
    } catch (error) {
      console.error('Error al buscar usuario por ID:', error);
      return null;
    }
  }

  async findByEmail(email: Email): Promise<User | null> {
    try {
      const doc = await UserModel.findByEmail(email.value);
      return doc ? this.toEntity(doc) : null;
    } catch (error) {
      console.error('Error al buscar usuario por email:', error);
      return null;
    }
  }

  async findByRole(role: string): Promise<User[]> {
    try {
      const docs = await UserModel.findByRole(role as UserRole);
      return docs.map(doc => this.toEntity(doc));
    } catch (error) {
      console.error('Error al buscar usuarios por rol:', error);
      return [];
    }
  }

  async findAllActive(): Promise<User[]> {
    try {
      const docs = await UserModel.findActive();
      return docs.map(doc => this.toEntity(doc));
    } catch (error) {
      console.error('Error al buscar usuarios activos:', error);
      return [];
    }
  }

  async findAll(limit?: number, offset?: number): Promise<User[]> {
    try {
      let query = UserModel.find({}).sort({ createdAt: -1 });
      
      if (offset) {
        query = query.skip(offset);
      }
      
      if (limit) {
        query = query.limit(limit);
      }
      
      const docs = await query.exec();
      return docs.map(doc => this.toEntity(doc));
    } catch (error) {
      console.error('Error al buscar todos los usuarios:', error);
      return [];
    }
  }

  async findByNameContains(nameSearchTerm: string): Promise<User[]> {
    try {
      const regex = new RegExp(nameSearchTerm, 'i');
      const docs = await UserModel.find({
        $or: [
          { firstName: regex },
          { lastName: regex },
          { middleName: regex }
        ]
      });
      
      return docs.map(doc => this.toEntity(doc));
    } catch (error) {
      console.error('Error al buscar usuarios por nombre:', error);
      return [];
    }
  }

  async count(): Promise<number> {
    try {
      return await UserModel.countDocuments();
    } catch (error) {
      console.error('Error al contar usuarios:', error);
      return 0;
    }
  }

  async countByStatus(status: string): Promise<number> {
    try {
      return await UserModel.countDocuments({ status });
    } catch (error) {
      console.error('Error al contar usuarios por estado:', error);
      return 0;
    }
  }

  async update(user: User): Promise<User> {
    try {
      const userData = this.toDocument(user);
      const doc = await UserModel.findByIdAndUpdate(
        user.id,
        userData,
        { new: true, runValidators: true }
      );
      
      if (!doc) {
        throw new Error('Usuario no encontrado para actualizar');
      }
      
      return this.toEntity(doc);
    } catch (error: any) {
      throw new Error(`Error al actualizar usuario: ${error.message}`);
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      // Soft delete - cambiar estado a DELETED
      const doc = await UserModel.findByIdAndUpdate(
        id,
        { status: UserStatus.DELETED },
        { new: true }
      );
      
      return doc !== null;
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      return false;
    }
  }

  async hardDelete(id: string): Promise<boolean> {
    try {
      const result = await UserModel.findByIdAndDelete(id);
      return result !== null;
    } catch (error) {
      console.error('Error al eliminar usuario permanentemente:', error);
      return false;
    }
  }

  async existsByEmail(email: Email): Promise<boolean> {
    try {
      const count = await UserModel.countDocuments({ email: email.value });
      return count > 0;
    } catch (error) {
      console.error('Error al verificar existencia de email:', error);
      return false;
    }
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<User[]> {
    try {
      const docs = await UserModel.find({
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      }).sort({ createdAt: -1 });
      
      return docs.map(doc => this.toEntity(doc));
    } catch (error) {
      console.error('Error al buscar usuarios por rango de fechas:', error);
      return [];
    }
  }

  // Métodos específicos de MongoDB

  /**
   * Buscar administradores activos
   */
  async findAdmins(): Promise<User[]> {
    try {
      const docs = await UserModel.find({
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE
      });
      
      return docs.map(doc => this.toEntity(doc));
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
      const result = await UserModel.findByIdAndUpdate(
        userId,
        { 
          lastLoginAt: new Date(),
          $unset: { loginAttempts: 1, lockUntil: 1 } // Reset login attempts
        }
      );
      
      return result !== null;
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
      const doc = await UserModel.findOne({ email });
      if (doc) {
        await doc.incLoginAttempts();
        return true;
      }
      return false;
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
      const doc = await UserModel.findOne({ email });
      return doc ? doc.isLocked : false;
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
      const result = await UserModel.findByIdAndUpdate(
        userId,
        { 
          passwordHash: newPasswordHash,
          $inc: { version: 1 }
        }
      );
      
      return result !== null;
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
      const stats = await UserModel.aggregate([
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            activeUsers: {
              $sum: { $cond: [{ $eq: ['$status', UserStatus.ACTIVE] }, 1, 0] }
            },
            adminUsers: {
              $sum: { $cond: [{ $eq: ['$role', UserRole.ADMIN] }, 1, 0] }
            },
            moderatorUsers: {
              $sum: { $cond: [{ $eq: ['$role', UserRole.MODERATOR] }, 1, 0] }
            },
            regularUsers: {
              $sum: { $cond: [{ $eq: ['$role', UserRole.USER] }, 1, 0] }
            },
            verifiedUsers: {
              $sum: { $cond: ['$isEmailVerified', 1, 0] }
            }
          }
        }
      ]);

      return stats[0] || {
        totalUsers: 0,
        activeUsers: 0,
        adminUsers: 0,
        moderatorUsers: 0,
        regularUsers: 0,
        verifiedUsers: 0
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
   * Limpiar base de datos (solo para testing)
   */
  async clear(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('No se puede limpiar la base de datos en producción');
    }
    
    await UserModel.deleteMany({});
  }
}
