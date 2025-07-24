import { Request, Response } from 'express';
import { BaseController } from './BaseController';
import { ResponseUtil } from '../utils/response';
import { HttpStatus } from '../types';
import { User, UserRole, UserStatus } from '../domain/entities/User';
import { hasPermission, Permission } from '../middlewares/roleBasedAccess';
import { InMemoryUserRepository } from '../infrastructure/repositories/InMemoryUserRepository';

/**
 * Controlador que demuestra el uso de control de acceso basado en roles
 * dentro de la lógica de negocio del controlador
 */
export class RoleBasedController extends BaseController {
  private userRepository = new InMemoryUserRepository();

  /**
   * Obtener estadísticas del dashboard según el rol del usuario
   */
  getDashboardStats = async (req: Request, res: Response): Promise<Response> => {
    try {
      const user = req.user!;
      let stats: any = {};

      // Estadísticas base para todos los usuarios autenticados
      stats.userInfo = {
        id: user.userId,
        email: user.email,
        role: user.role,
        lastLogin: new Date().toISOString()
      };

      // Estadísticas específicas según el rol
      switch (user.role) {
        case UserRole.ADMIN:
          stats = {
            ...stats,
            systemStats: {
              totalUsers: 1250,
              activeUsers: 890,
              bannedUsers: 12,
              totalPosts: 3400,
              reportedContent: 45,
              systemUptime: '99.9%'
            },
            permissions: ['ALL_PERMISSIONS'],
            adminTools: [
              'user_management',
              'system_settings',
              'analytics',
              'moderation_tools'
            ]
          };
          break;

        case UserRole.MODERATOR:
          stats = {
            ...stats,
            moderationStats: {
              pendingReports: 8,
              resolvedToday: 15,
              bannedUsersThisWeek: 3,
              contentModerated: 67
            },
            moderationTools: [
              'ban_users',
              'delete_content',
              'review_reports',
              'edit_posts'
            ]
          };
          break;

        case UserRole.USER:
          stats = {
            ...stats,
            userStats: {
              postsCreated: 23,
              commentsCount: 145,
              likesReceived: 89,
              followers: 12
            },
            availableFeatures: [
              'create_posts',
              'comment',
              'like',
              'share',
              'edit_own_content'
            ]
          };
          break;

        case UserRole.GUEST:
          stats = {
            ...stats,
            guestInfo: {
              message: 'Registrate para acceder a más funciones',
              limitations: ['read_only', 'limited_search'],
              encouragement: 'Únete a nuestra comunidad!'
            }
          };
          break;
      }

      return ResponseUtil.success(res, stats, 'Estadísticas del dashboard obtenidas');

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al obtener estadísticas';
      return ResponseUtil.error(res, message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  };

  /**
   * Gestionar usuarios - con diferentes operaciones según el rol
   */
  manageUser = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { userId } = req.params;
      const { action } = req.body;
      const currentUser = req.user!;

      // Verificar si el usuario actual puede gestionar otros usuarios
      if (!hasPermission(currentUser.role, Permission.UPDATE_USER)) {
        return ResponseUtil.error(res, 'No tienes permisos para gestionar usuarios', HttpStatus.FORBIDDEN);
      }

      const targetUser = await this.userRepository.findById(userId);
      if (!targetUser) {
        return ResponseUtil.error(res, 'Usuario no encontrado', HttpStatus.NOT_FOUND);
      }

      let result: any = {};

      switch (action) {
        case 'activate':
          if (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.MODERATOR) {
            targetUser.activate();
            await this.userRepository.update(targetUser);
            result = { action: 'activated', user: targetUser.toObject() };
          } else {
            return ResponseUtil.error(res, 'No tienes permisos para activar usuarios', HttpStatus.FORBIDDEN);
          }
          break;

        case 'deactivate':
          if (currentUser.role === UserRole.ADMIN) {
            targetUser.deactivate();
            await this.userRepository.update(targetUser);
            result = { action: 'deactivated', user: targetUser.toObject() };
          } else {
            return ResponseUtil.error(res, 'Solo los administradores pueden desactivar usuarios', HttpStatus.FORBIDDEN);
          }
          break;

        case 'change_role':
          if (currentUser.role === UserRole.ADMIN && hasPermission(currentUser.role, Permission.MANAGE_USER_ROLES)) {
            const { newRole } = req.body;
            
            if (!Object.values(UserRole).includes(newRole)) {
              return ResponseUtil.error(res, 'Rol inválido', HttpStatus.BAD_REQUEST);
            }

            targetUser.changeRole(newRole);
            await this.userRepository.update(targetUser);
            result = { action: 'role_changed', user: targetUser.toObject(), newRole };
          } else {
            return ResponseUtil.error(res, 'Solo los administradores pueden cambiar roles', HttpStatus.FORBIDDEN);
          }
          break;

        case 'suspend':
          if (currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.MODERATOR) {
            targetUser.suspend();
            await this.userRepository.update(targetUser);
            result = { action: 'suspended', user: targetUser.toObject() };
          } else {
            return ResponseUtil.error(res, 'No tienes permisos para suspender usuarios', HttpStatus.FORBIDDEN);
          }
          break;

        default:
          return ResponseUtil.error(res, 'Acción no válida', HttpStatus.BAD_REQUEST);
      }

      // Log de la acción realizada
      console.log(`🔐 Acción de gestión de usuario:`, {
        performedBy: currentUser.userId,
        performerRole: currentUser.role,
        targetUser: userId,
        action,
        timestamp: new Date().toISOString()
      });

      return ResponseUtil.success(res, result, `Usuario ${action} exitosamente`);

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al gestionar usuario';
      return ResponseUtil.error(res, message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  };

  /**
   * Obtener contenido con diferentes niveles de detalle según el rol
   */
  getContentWithRoleBasedDetails = async (req: Request, res: Response): Promise<Response> => {
    try {
      const user = req.user!;
      const { contentId } = req.params;

      // Contenido base disponible para todos
      let content: any = {
        id: contentId,
        title: 'Ejemplo de contenido',
        summary: 'Este es un resumen del contenido...',
        author: 'autor_ejemplo',
        createdAt: new Date().toISOString(),
        isPublic: true
      };

      // Agregar detalles según el rol del usuario
      if (hasPermission(user.role, Permission.READ_CONTENT)) {
        content.fullContent = 'Aquí va el contenido completo que solo pueden ver usuarios autenticados...';
        content.statistics = {
          views: 1250,
          likes: 89,
          comments: 23
        };
      }

      if (hasPermission(user.role, Permission.MODERATE_CONTENT)) {
        content.moderationInfo = {
          reports: 2,
          flags: ['spam_reported'],
          lastModerated: new Date().toISOString(),
          moderatedBy: 'moderator_123'
        };
      }

      if (user.role === UserRole.ADMIN) {
        content.adminInfo = {
          internalId: 'internal_' + contentId,
          systemFlags: ['trending', 'promoted'],
          revenue: 45.67,
          analyticsData: {
            impressions: 5670,
            clickThrough: 0.12,
            engagement: 0.08
          }
        };
      }

      // Agregar acciones disponibles según permisos
      const availableActions: string[] = [];
      
      if (hasPermission(user.role, Permission.UPDATE_CONTENT)) {
        availableActions.push('edit');
      }
      
      if (hasPermission(user.role, Permission.DELETE_CONTENT)) {
        availableActions.push('delete');
      }
      
      if (hasPermission(user.role, Permission.MODERATE_CONTENT)) {
        availableActions.push('moderate', 'flag', 'approve');
      }

      content.availableActions = availableActions;

      return ResponseUtil.success(res, content, 'Contenido obtenido con detalles basados en rol');

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al obtener contenido';
      return ResponseUtil.error(res, message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  };

  /**
   * Crear contenido con validaciones específicas por rol
   */
  createContentWithRoleValidation = async (req: Request, res: Response): Promise<Response> => {
    try {
      const user = req.user!;
      const { title, content, category, tags, isPrivate } = req.body;

      // Verificar permiso básico de creación
      if (!hasPermission(user.role, Permission.CREATE_CONTENT)) {
        return ResponseUtil.error(res, 'No tienes permisos para crear contenido', HttpStatus.FORBIDDEN);
      }

      // Validaciones específicas por rol
      const newContent: any = {
        id: `content_${Date.now()}`,
        title,
        content,
        author: user.userId,
        category,
        tags: tags || [],
        createdAt: new Date().toISOString(),
        status: 'draft'
      };

      switch (user.role) {
        case UserRole.GUEST:
          return ResponseUtil.error(res, 'Los invitados no pueden crear contenido', HttpStatus.FORBIDDEN);

        case UserRole.USER:
          // Usuarios normales: limitaciones básicas
          newContent.status = 'pending_review'; // Requiere revisión
          newContent.isPrivate = isPrivate || false;
          
          if (tags && tags.length > 5) {
            return ResponseUtil.error(res, 'Los usuarios pueden usar máximo 5 tags', HttpStatus.BAD_REQUEST);
          }
          break;

        case UserRole.MODERATOR:
          // Moderadores: menos restricciones
          newContent.status = 'published'; // Pueden publicar directamente
          newContent.isPrivate = isPrivate || false;
          newContent.moderatedBy = user.userId;
          break;

        case UserRole.ADMIN:
          // Admins: sin restricciones
          newContent.status = req.body.status || 'published';
          newContent.isPrivate = isPrivate || false;
          newContent.canFeature = true; // Pueden destacar contenido
          newContent.canPromote = true; // Pueden promover contenido
          break;
      }

      // Simular guardado en base de datos
      console.log(`📝 Contenido creado:`, {
        createdBy: user.userId,
        userRole: user.role,
        contentId: newContent.id,
        status: newContent.status
      });

      return ResponseUtil.success(res, newContent, 'Contenido creado exitosamente');

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al crear contenido';
      return ResponseUtil.error(res, message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  };

  /**
   * Ejemplo de validación de acceso programática
   */
  checkUserAccess = async (req: Request, res: Response): Promise<Response> => {
    try {
      const user = req.user!;
      const { resource, action } = req.query;

      let hasAccess = false;
      let reason = '';

      // Lógica personalizada de verificación de acceso
      switch (resource) {
        case 'admin_panel':
          hasAccess = hasPermission(user.role, Permission.ACCESS_ADMIN_PANEL);
          reason = hasAccess ? 'Acceso permitido' : 'Requiere permisos de administrador';
          break;

        case 'user_management':
          hasAccess = hasPermission(user.role, Permission.MANAGE_USER_ROLES);
          reason = hasAccess ? 'Acceso permitido' : 'Requiere permisos de gestión de usuarios';
          break;

        case 'analytics':
          hasAccess = hasPermission(user.role, Permission.VIEW_ANALYTICS);
          reason = hasAccess ? 'Acceso permitido' : 'Requiere permisos de analytics';
          break;

        case 'moderation':
          hasAccess = hasPermission(user.role, Permission.MODERATE_CONTENT);
          reason = hasAccess ? 'Acceso permitido' : 'Requiere permisos de moderación';
          break;

        default:
          reason = 'Recurso no reconocido';
      }

      return ResponseUtil.success(res, {
        user: {
          id: user.userId,
          role: user.role
        },
        resource,
        action,
        hasAccess,
        reason,
        checkedAt: new Date().toISOString()
      }, 'Verificación de acceso completada');

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al verificar acceso';
      return ResponseUtil.error(res, message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  };
}
