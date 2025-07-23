import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { asyncHandler, createError } from '../middlewares/errorHandler';
import { UserDomainService } from '../domain/services/UserDomainService';
import { UserRole, UserStatus } from '../domain/entities/User';
import { ResponseUtil } from '../utils/response';

export class UserController extends BaseController {
  constructor(private userDomainService: UserDomainService) {
    super();
  }

  /**
   * POST /users - Crear un nuevo usuario
   */
  createUser = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
    const userData = this.validateBody<{
      email: string;
      firstName: string;
      lastName: string;
      middleName?: string;
      role?: UserRole;
      avatar?: string;
    }>(req, ['email', 'firstName', 'lastName']);

    const user = await this.userDomainService.createUser(userData);

    return ResponseUtil.created(res, user.toObject(), 'Usuario creado exitosamente');
  });

  /**
   * GET /users/:id - Obtener un usuario por ID
   */
  getUserById = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    
    if (!id) {
      throw createError.validation('ID de usuario es requerido');
    }

    // Aquí normalmente obtendrías el usuario autenticado del token
    // const currentUserId = req.user?.id;

    const user = await this.userDomainService.searchUsers({ limit: 1, offset: 0 });
    const foundUser = user.find(u => u.id === id);

    if (!foundUser) {
      throw createError.notFound('Usuario');
    }

    return ResponseUtil.success(res, foundUser.toObject());
  });

  /**
   * GET /users - Buscar usuarios con filtros
   */
  searchUsers = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
    const filters = {
      email: this.getQuery(req, 'email'),
      name: this.getQuery(req, 'name'),
      role: this.getQuery(req, 'role') as UserRole,
      status: this.getQuery(req, 'status') as UserStatus,
      isEmailVerified: this.getQuery(req, 'isEmailVerified') === 'true' ? true : 
                      this.getQuery(req, 'isEmailVerified') === 'false' ? false : undefined,
      limit: parseInt(this.getQuery(req, 'limit', '10')!),
      offset: parseInt(this.getQuery(req, 'offset', '0')!)
    };

    const users = await this.userDomainService.searchUsers(filters);
    const userObjects = users.map(user => user.toObject());

    return ResponseUtil.success(res, {
      users: userObjects,
      total: userObjects.length,
      filters: filters
    });
  });

  /**
   * PUT /users/:id/email - Actualizar email de usuario
   */
  updateUserEmail = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const { email } = this.validateBody<{ email: string }>(req, ['email']);

    if (!id) {
      throw createError.validation('ID de usuario es requerido');
    }

    const user = await this.userDomainService.updateUserEmail(id, email);

    return ResponseUtil.success(res, user.toObject(), 'Email actualizado exitosamente');
  });

  /**
   * PUT /users/:id/role - Cambiar rol de usuario
   */
  changeUserRole = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const { role } = this.validateBody<{ role: UserRole }>(req, ['role']);

    if (!id) {
      throw createError.validation('ID de usuario es requerido');
    }

    // En una implementación real, obtendrías el ID del admin del token JWT
    const adminUserId = 'admin-user-id'; // Placeholder

    const user = await this.userDomainService.changeUserRole(id, role, adminUserId);

    return ResponseUtil.success(res, user.toObject(), 'Rol actualizado exitosamente');
  });

  /**
   * PUT /users/:id/toggle-status - Activar/desactivar usuario
   */
  toggleUserStatus = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
    const { id } = req.params;
    const { activate } = this.validateBody<{ activate: boolean }>(req, ['activate']);

    if (!id) {
      throw createError.validation('ID de usuario es requerido');
    }

    // En una implementación real, obtendrías el ID del admin del token JWT
    const adminUserId = 'admin-user-id'; // Placeholder

    const user = await this.userDomainService.toggleUserStatus(id, activate, adminUserId);

    const action = activate ? 'activado' : 'desactivado';
    return ResponseUtil.success(res, user.toObject(), `Usuario ${action} exitosamente`);
  });

  /**
   * GET /users/stats - Obtener estadísticas de usuarios
   */
  getUserStats = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
    const stats = await this.userDomainService.getUserStats();

    return ResponseUtil.success(res, stats, 'Estadísticas obtenidas exitosamente');
  });

  /**
   * POST /users/demo - Crear usuarios de demostración
   */
  createDemoUsers = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
    const demoUsers = [
      {
        email: 'admin@demo.com',
        firstName: 'Carlos',
        lastName: 'Administrador',
        role: UserRole.ADMIN
      },
      {
        email: 'moderator@demo.com',
        firstName: 'María',
        lastName: 'Moderadora',
        middleName: 'Elena',
        role: UserRole.MODERATOR
      },
      {
        email: 'user@demo.com',
        firstName: 'Juan',
        lastName: 'Usuario',
        role: UserRole.USER
      },
      {
        email: 'guest@demo.com',
        firstName: 'Ana',
        lastName: 'Invitada',
        role: UserRole.GUEST
      }
    ];

    const createdUsers = [];

    for (const userData of demoUsers) {
      try {
        const user = await this.userDomainService.createUser(userData);
        createdUsers.push(user.toObject());
      } catch (error) {
        // Si el usuario ya existe, lo ignoramos
        console.log(`Usuario ${userData.email} ya existe, saltando...`);
      }
    }

    return ResponseUtil.success(res, {
      created: createdUsers,
      total: createdUsers.length
    }, 'Usuarios de demostración creados');
  });

  /**
   * GET /users/:id/permissions/:action - Verificar permisos de usuario
   */
  checkUserPermissions = asyncHandler(async (req: Request, res: Response): Promise<Response> => {
    const { id, action } = req.params;
    const targetUserId = this.getQuery(req, 'targetUserId');

    if (!id || !action) {
      throw createError.validation('ID de usuario y acción son requeridos');
    }

    const canPerform = await this.userDomainService.canUserPerform(id, action, targetUserId);

    return ResponseUtil.success(res, {
      userId: id,
      action,
      targetUserId,
      canPerform
    });
  });
}
