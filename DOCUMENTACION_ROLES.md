# 📋 Documentación del Sistema de Roles

Esta documentación describe el sistema completo de roles, permisos y control de acceso implementado en la API Template.

## 📑 Índice

1. [Arquitectura General](#arquitectura-general)
2. [Definición de Roles](#definición-de-roles)
3. [Sistema de Permisos](#sistema-de-permisos)
4. [Matriz de Permisos por Rol](#matriz-de-permisos-por-rol)
5. [Estados de Usuario](#estados-de-usuario)
6. [Implementación Técnica](#implementación-técnica)
7. [Middlewares de Control de Acceso](#middlewares-de-control-de-acceso)
8. [Ejemplos de Uso](#ejemplos-de-uso)
9. [Casos de Uso por Rol](#casos-de-uso-por-rol)

---

## 🏗️ Arquitectura General

El sistema de roles está diseñado con una arquitectura modular que separa claramente:

- **Entidades de Dominio**: Definición de usuarios y roles
- **Middlewares**: Control de acceso HTTP
- **Controladores**: Lógica de negocio específica por rol
- **Repositorios**: Persistencia de datos

### Componentes Principales

```
src/
├── domain/entities/User.ts              # Entidad principal con roles
├── middlewares/roleBasedAccess.ts       # Sistema de control de acceso
├── controllers/RoleBasedController.ts   # Ejemplos de implementación
└── infrastructure/repositories/         # Persistencia de datos
```

---

## 👥 Definición de Roles

### Jerarquía de Roles

```typescript
enum UserRole {
  ADMIN = 'admin',        // Administrador del sistema
  MODERATOR = 'moderator', // Moderador de contenido
  USER = 'user',          // Usuario registrado
  GUEST = 'guest'         // Invitado (solo lectura)
}
```

### Descripción Detallada de Roles

#### 🔴 ADMIN (Administrador)
- **Descripción**: Control total del sistema
- **Capacidades principales**:
  - ✅ Acceso completo a todas las funcionalidades
  - ✅ Gestión completa de usuarios (crear, editar, eliminar, cambiar roles)
  - ✅ Configuración del sistema
  - ✅ Acceso a analytics completos
  - ✅ Panel de administración
  - ✅ Moderación de contenido
  - ✅ Gestión de permisos

#### 🟡 MODERATOR (Moderador)
- **Descripción**: Gestión de contenido y moderación de usuarios
- **Capacidades principales**:
  - ✅ Moderación de contenido
  - ✅ Banear/suspender usuarios
  - ✅ Editar contenido de otros usuarios
  - ✅ Eliminar comentarios y posts
  - ✅ Acceso a herramientas de moderación
  - ✅ Ver reportes y estadísticas de moderación
  - ❌ No puede cambiar roles de usuarios
  - ❌ No puede acceder al panel de administración

#### 🟢 USER (Usuario Registrado)
- **Descripción**: Usuario estándar con capacidades de creación
- **Capacidades principales**:
  - ✅ Crear contenido propio
  - ✅ Editar su propio contenido
  - ✅ Interacciones sociales (likes, comentarios)
  - ✅ Gestionar su perfil personal
  - ✅ Leer contenido público
  - ❌ No puede moderar contenido
  - ❌ No puede gestionar otros usuarios

#### ⚪ GUEST (Invitado)
- **Descripción**: Acceso limitado de solo lectura
- **Capacidades principales**:
  - ✅ Solo lectura de contenido público
  - ✅ Navegación limitada
  - ❌ No puede crear contenido
  - ❌ No puede interactuar (likes, comentarios)
  - ❌ No puede acceder a funciones avanzadas

---

## 🔐 Sistema de Permisos

### Categorías de Permisos

#### Gestión de Usuarios
```typescript
CREATE_USER = 'create_user'           // Crear nuevos usuarios
READ_USER = 'read_user'               // Ver información de usuarios
UPDATE_USER = 'update_user'           // Actualizar datos de usuarios
DELETE_USER = 'delete_user'           // Eliminar usuarios
MANAGE_USER_ROLES = 'manage_user_roles' // Cambiar roles de usuarios
```

#### Gestión de Contenido
```typescript
CREATE_CONTENT = 'create_content'     // Crear contenido
READ_CONTENT = 'read_content'         // Leer contenido
UPDATE_CONTENT = 'update_content'     // Actualizar contenido
DELETE_CONTENT = 'delete_content'     // Eliminar contenido
MODERATE_CONTENT = 'moderate_content' // Moderar contenido
```

#### Sistema y Administración
```typescript
VIEW_ANALYTICS = 'view_analytics'        // Ver estadísticas
MANAGE_SYSTEM = 'manage_system'          // Gestionar sistema
ACCESS_ADMIN_PANEL = 'access_admin_panel' // Acceso al panel admin
```

#### Moderación Específica
```typescript
BAN_USERS = 'ban_users'                 // Banear usuarios
DELETE_COMMENTS = 'delete_comments'     // Eliminar comentarios
EDIT_ANY_CONTENT = 'edit_any_content'   // Editar cualquier contenido
```

---

## 📊 Matriz de Permisos por Rol

| Permiso | ADMIN | MODERATOR | USER | GUEST |
|---------|-------|-----------|------|-------|
| **Gestión de Usuarios** |
| CREATE_USER | ✅ | ❌ | ❌ | ❌ |
| READ_USER | ✅ | ✅ | ✅ | ❌ |
| UPDATE_USER | ✅ | ✅ | ⚠️ Solo propio | ❌ |
| DELETE_USER | ✅ | ❌ | ❌ | ❌ |
| MANAGE_USER_ROLES | ✅ | ❌ | ❌ | ❌ |
| **Gestión de Contenido** |
| CREATE_CONTENT | ✅ | ✅ | ✅ | ❌ |
| READ_CONTENT | ✅ | ✅ | ✅ | ✅ |
| UPDATE_CONTENT | ✅ | ✅ | ⚠️ Solo propio | ❌ |
| DELETE_CONTENT | ✅ | ✅ | ⚠️ Solo propio | ❌ |
| MODERATE_CONTENT | ✅ | ✅ | ❌ | ❌ |
| **Sistema** |
| VIEW_ANALYTICS | ✅ | ✅ | ❌ | ❌ |
| MANAGE_SYSTEM | ✅ | ❌ | ❌ | ❌ |
| ACCESS_ADMIN_PANEL | ✅ | ❌ | ❌ | ❌ |
| **Moderación** |
| BAN_USERS | ✅ | ✅ | ❌ | ❌ |
| DELETE_COMMENTS | ✅ | ✅ | ❌ | ❌ |
| EDIT_ANY_CONTENT | ✅ | ✅ | ❌ | ❌ |

**Leyenda:**
- ✅ = Permiso completo
- ⚠️ = Permiso limitado (solo recursos propios)
- ❌ = Sin permiso

---

## 📊 Estados de Usuario

### Definición de Estados

```typescript
enum UserStatus {
  ACTIVE = 'active',        // Usuario activo y funcional
  INACTIVE = 'inactive',    // Usuario inactivo (puede reactivarse)
  SUSPENDED = 'suspended',  // Usuario suspendido temporalmente
  DELETED = 'deleted'       // Usuario eliminado (soft delete)
}
```

### Transiciones de Estado

| Estado Actual | Estados Permitidos | Quién puede cambiar |
|---------------|-------------------|-------------------|
| ACTIVE | INACTIVE, SUSPENDED | ADMIN, MODERATOR |
| INACTIVE | ACTIVE | ADMIN, MODERATOR |
| SUSPENDED | ACTIVE, INACTIVE | ADMIN |
| DELETED | - | Solo ADMIN |

---

## 🛠️ Implementación Técnica

### Entidad User

La entidad `User` encapsula tanto el rol como los métodos de negocio:

```typescript
export class User extends BaseEntity {
  private _role: UserRole;
  private _status: UserStatus;
  
  // Método para verificar capacidades
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
  
  // Verificaciones específicas
  isAdmin(): boolean {
    return this._role === UserRole.ADMIN;
  }
  
  isActive(): boolean {
    return this._status === UserStatus.ACTIVE;
  }
}
```

---

## 🛡️ Middlewares de Control de Acceso

### Middlewares Básicos

```typescript
// Verificar autenticación
authenticateToken

// Verificar roles específicos
requireRole(UserRole.ADMIN, UserRole.MODERATOR)
requireAdmin
requireAdminOrModerator
```

### Middlewares Avanzados

```typescript
// Verificar permisos específicos
requirePermissions(Permission.CREATE_USER, Permission.UPDATE_USER)

// Control de acceso complejo
requireAccess({
  roles: [UserRole.ADMIN],
  permissions: [Permission.MANAGE_SYSTEM],
  requireOwnership: true,
  customValidator: (req) => req.user.isActive
})
```

### Helpers Predefinidos

```typescript
AccessRules.adminOnly()                    // Solo administradores
AccessRules.adminOrModerator()            // Admin o moderador
AccessRules.authenticatedUsers()          // Usuarios autenticados
AccessRules.ownResourceOrAdmin('userId')  // Propio recurso o admin
AccessRules.contentManagement()           // Gestión de contenido
AccessRules.userManagement()              // Gestión de usuarios
AccessRules.moderation()                  // Herramientas de moderación
```

---

## 💡 Ejemplos de Uso

### 1. Endpoint con Control de Roles

```typescript
// Solo administradores
router.get('/admin/users', 
  authenticateToken, 
  requireAdmin, 
  controller.getUsers
);

// Admin o moderador
router.get('/moderation/reports',
  authenticateToken,
  requireAccess(AccessRules.adminOrModerator()),
  controller.getReports
);
```

### 2. Endpoint con Permisos Específicos

```typescript
// Requiere permisos específicos
router.post('/content',
  authenticateToken,
  requirePermissions(Permission.CREATE_CONTENT),
  controller.createContent
);
```

### 3. Endpoint con Verificación de Propiedad

```typescript
// Solo el propietario o admin puede editar
router.put('/users/:id',
  authenticateToken,
  requireAccess(AccessRules.ownResourceOrAdmin('id')),
  controller.updateUser
);
```

### 4. Lógica de Negocio en Controlador

```typescript
export class ContentController {
  async createContent(req: Request, res: Response) {
    const user = req.user!;
    
    // Verificar permisos en el controlador
    if (!hasPermission(user.role, Permission.CREATE_CONTENT)) {
      return ResponseUtil.error(res, 'Sin permisos', 403);
    }
    
    // Lógica específica por rol
    let contentStatus = 'draft';
    
    switch (user.role) {
      case UserRole.ADMIN:
      case UserRole.MODERATOR:
        contentStatus = 'published'; // Publicar directamente
        break;
      case UserRole.USER:
        contentStatus = 'pending_review'; // Requiere revisión
        break;
    }
    
    // Crear contenido con estado apropiado
    const content = await this.createWithStatus(req.body, contentStatus);
    
    return ResponseUtil.success(res, content, 'Contenido creado');
  }
}
```

---

## 🎯 Casos de Uso por Rol

### Administrador (ADMIN)

**Dashboard del Administrador:**
```json
{
  "systemStats": {
    "totalUsers": 1250,
    "activeUsers": 890,
    "bannedUsers": 12,
    "totalPosts": 3400,
    "reportedContent": 45,
    "systemUptime": "99.9%"
  },
  "permissions": ["ALL_PERMISSIONS"],
  "adminTools": [
    "user_management",
    "system_settings", 
    "analytics",
    "moderation_tools"
  ]
}
```

**Acciones disponibles:**
- ✅ Crear, editar, eliminar usuarios
- ✅ Cambiar roles de usuarios
- ✅ Acceso a panel de administración
- ✅ Ver analytics completos
- ✅ Configuración del sistema
- ✅ Moderar todo el contenido

### Moderador (MODERATOR)

**Dashboard del Moderador:**
```json
{
  "moderationStats": {
    "pendingReports": 8,
    "resolvedToday": 15,
    "bannedUsersThisWeek": 3,
    "contentModerated": 67
  },
  "moderationTools": [
    "ban_users",
    "delete_content",
    "review_reports",
    "edit_posts"
  ]
}
```

**Acciones disponibles:**
- ✅ Moderar contenido
- ✅ Banear/suspender usuarios
- ✅ Eliminar comentarios y posts
- ✅ Revisar reportes
- ✅ Publicar contenido directamente
- ❌ No puede cambiar roles
- ❌ No puede acceder a configuración del sistema

### Usuario Registrado (USER)

**Dashboard del Usuario:**
```json
{
  "userStats": {
    "postsCreated": 23,
    "commentsCount": 145,
    "likesReceived": 89,
    "followers": 12
  },
  "availableFeatures": [
    "create_posts",
    "comment",
    "like", 
    "share",
    "edit_own_content"
  ]
}
```

**Acciones disponibles:**
- ✅ Crear contenido (requiere revisión)
- ✅ Editar su propio contenido
- ✅ Interacciones sociales
- ✅ Gestionar perfil personal
- ❌ No puede moderar contenido
- ❌ No puede gestionar otros usuarios

### Invitado (GUEST)

**Dashboard del Invitado:**
```json
{
  "guestInfo": {
    "message": "Regístrate para acceder a más funciones",
    "limitations": ["read_only", "limited_search"],
    "encouragement": "¡Únete a nuestra comunidad!"
  }
}
```

**Acciones disponibles:**
- ✅ Solo lectura de contenido público
- ✅ Navegación limitada
- ❌ No puede crear contenido
- ❌ No puede interactuar
- ❌ No puede acceder a funciones avanzadas

---

## 🔧 Configuración y Mejores Prácticas

### Variables de Entorno
```env
JWT_SECRET=tu_clave_secreta_jwt_super_segura
JWT_EXPIRES_IN=24h
NODE_ENV=production
```

### Mejores Prácticas

1. **Principio de Menor Privilegio**: Los usuarios solo tienen los permisos mínimos necesarios
2. **Separación de Responsabilidades**: Roles claramente definidos con responsabilidades específicas
3. **Validación en Múltiples Capas**: Control de acceso tanto en middlewares como en lógica de negocio
4. **Auditoría**: Logging completo de todas las acciones relacionadas con permisos
5. **Escalabilidad**: Sistema fácil de extender con nuevos roles y permisos

### Consideraciones de Seguridad

- ✅ Tokens JWT con expiración
- ✅ Validación de roles en cada request
- ✅ Logging de acciones sensibles
- ✅ Separación clara entre autenticación y autorización
- ✅ Verificación de estado de usuario (activo/suspendido)

---

## 📚 Recursos Adicionales

- **Documentación completa**: `ROLE_BASED_AUTH.md`
- **Ejemplos de testing**: `test-auth.sh`
- **Colección Postman**: `postman/template_api_collection.json`
- **Guía de cURLs**: `docs/CURL_GUIDE.md`

---

*Esta documentación está diseñada para proporcionar una comprensión completa del sistema de roles y facilitar su implementación y mantenimiento.*
