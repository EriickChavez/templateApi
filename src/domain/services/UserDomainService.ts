import { User, UserRole, UserStatus } from '../entities/User';
import { Email } from '../value-objects/Email';
import { PersonName } from '../value-objects/PersonName';
import { UserRepository } from '../repositories/UserRepository';
import { createError } from '../../middlewares/errorHandler';

export class UserDomainService {
  constructor(private userRepository: UserRepository) {}

  /**
   * Crea un nuevo usuario verificando reglas de negocio
   */
  async createUser(userData: {
    email: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    role?: UserRole;
    avatar?: string;
  }): Promise<User> {
    
    // Crear value objects
    const email = new Email(userData.email);
    const name = new PersonName({
      firstName: userData.firstName,
      lastName: userData.lastName,
      middleName: userData.middleName
    });

    // Verificar que el email no esté en uso
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw createError.validation('El email ya está registrado', {
        email: userData.email,
        existingUserId: existingUser.id
      });
    }

    // Crear la entidad usuario
    const user = new User({
      email,
      name,
      role: userData.role || UserRole.USER,
      status: UserStatus.ACTIVE,
      avatar: userData.avatar,
      isEmailVerified: false
    });

    // Guardar en el repositorio
    const savedUser = await this.userRepository.save(user);

    return savedUser;
  }

  /**
   * Actualiza el email de un usuario con validaciones
   */
  async updateUserEmail(userId: string, newEmail: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw createError.notFound('Usuario');
    }

    const email = new Email(newEmail);

    // Verificar que el nuevo email no esté en uso por otro usuario
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser && !existingUser.equals(user)) {
      throw createError.validation('El email ya está en uso por otro usuario');
    }

    user.updateEmail(email);
    return await this.userRepository.update(user);
  }

  /**
   * Cambia el rol de un usuario con validaciones de negocio
   */
  async changeUserRole(userId: string, newRole: UserRole, adminUserId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw createError.notFound('Usuario');
    }

    const adminUser = await this.userRepository.findById(adminUserId);
    if (!adminUser || !adminUser.isAdmin()) {
      throw createError.forbidden('Solo los administradores pueden cambiar roles');
    }

    // No permitir que un admin se quite a sí mismo el rol de admin si es el único
    if (user.equals(adminUser) && user.role === UserRole.ADMIN && newRole !== UserRole.ADMIN) {
      const adminCount = await this.userRepository.countByStatus(UserRole.ADMIN);
      if (adminCount <= 1) {
        throw createError.validation('No puedes quitarte el rol de admin si eres el único administrador');
      }
    }

    user.changeRole(newRole);
    return await this.userRepository.update(user);
  }

  /**
   * Activa o desactiva un usuario
   */
  async toggleUserStatus(userId: string, activate: boolean, adminUserId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw createError.notFound('Usuario');
    }

    const adminUser = await this.userRepository.findById(adminUserId);
    if (!adminUser || (!adminUser.isAdmin() && !adminUser.canPerform('moderate'))) {
      throw createError.forbidden('No tienes permisos para cambiar el estado de usuarios');
    }

    // No permitir que un admin se desactive a sí mismo si es el único admin activo
    if (user.equals(adminUser) && user.isAdmin() && !activate) {
      const activeAdminCount = (await this.userRepository.findByRole(UserRole.ADMIN))
        .filter(u => u.isActive()).length;
      
      if (activeAdminCount <= 1) {
        throw createError.validation('No puedes desactivarte si eres el único administrador activo');
      }
    }

    if (activate) {
      user.activate();
    } else {
      user.deactivate();
    }

    return await this.userRepository.update(user);
  }

  /**
   * Verifica si un usuario puede realizar una acción específica
   */
  async canUserPerform(userId: string, action: string, targetUserId?: string): Promise<boolean> {
    const user = await this.userRepository.findById(userId);
    if (!user || !user.isActive()) {
      return false;
    }

    // Si la acción es sobre otro usuario, verificar permisos adicionales
    if (targetUserId && targetUserId !== userId) {
      const targetUser = await this.userRepository.findById(targetUserId);
      if (!targetUser) {
        return false;
      }

      // Los usuarios normales solo pueden ver/editar sus propios datos
      if (user.role === UserRole.USER && action.includes('update')) {
        return false;
      }

      // Los moderadores no pueden actuar sobre admins
      if (user.role === UserRole.MODERATOR && targetUser.role === UserRole.ADMIN) {
        return false;
      }
    }

    return user.canPerform(action);
  }

  /**
   * Obtiene estadísticas de usuarios
   */
  async getUserStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    suspended: number;
    byRole: Record<string, number>;
  }> {
    const total = await this.userRepository.count();
    const active = await this.userRepository.countByStatus(UserStatus.ACTIVE);
    const inactive = await this.userRepository.countByStatus(UserStatus.INACTIVE);
    const suspended = await this.userRepository.countByStatus(UserStatus.SUSPENDED);

    const adminUsers = await this.userRepository.findByRole(UserRole.ADMIN);
    const moderatorUsers = await this.userRepository.findByRole(UserRole.MODERATOR);
    const regularUsers = await this.userRepository.findByRole(UserRole.USER);
    const guestUsers = await this.userRepository.findByRole(UserRole.GUEST);

    return {
      total,
      active,
      inactive,
      suspended,
      byRole: {
        [UserRole.ADMIN]: adminUsers.length,
        [UserRole.MODERATOR]: moderatorUsers.length,
        [UserRole.USER]: regularUsers.length,
        [UserRole.GUEST]: guestUsers.length
      }
    };
  }

  /**
   * Busca usuarios con filtros
   */
  async searchUsers(filters: {
    email?: string;
    name?: string;
    role?: UserRole;
    status?: UserStatus;
    isEmailVerified?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<User[]> {
    let users: User[] = [];

    if (filters.email) {
      const email = new Email(filters.email);
      const user = await this.userRepository.findByEmail(email);
      users = user ? [user] : [];
    } else if (filters.name) {
      users = await this.userRepository.findByNameContains(filters.name);
    } else if (filters.role) {
      users = await this.userRepository.findByRole(filters.role);
    } else {
      users = await this.userRepository.findAll(filters.limit, filters.offset);
    }

    // Aplicar filtros adicionales
    if (filters.status) {
      users = users.filter(user => user.status === filters.status);
    }

    if (filters.isEmailVerified !== undefined) {
      users = users.filter(user => user.isEmailVerified === filters.isEmailVerified);
    }

    return users;
  }
}
