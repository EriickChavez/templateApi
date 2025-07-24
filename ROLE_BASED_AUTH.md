# Sistema de Autenticación y Autorización Basado en Roles

Este documento describe el sistema completo de autenticación y autorización implementado en la API, incluyendo roles, permisos y ejemplos de uso.

## 📋 Tabla de Contenidos

1. [Arquitectura del Sistema](#arquitectura-del-sistema)
2. [Roles de Usuario](#roles-de-usuario)
3. [Sistema de Permisos](#sistema-de-permisos)
4. [Middlewares Disponibles](#middlewares-disponibles)
5. [Ejemplos de Implementación](#ejemplos-de-implementación)
6. [Rutas de API](#rutas-de-api)
7. [Testing](#testing)

## 🏗️ Arquitectura del Sistema

### Componentes Principales

```
src/
├── domain/entities/User.ts          # Entidad de usuario con roles
├── middlewares/
│   ├── auth.ts                      # Middlewares básicos de autenticación
│   └── roleBasedAccess.ts          # Sistema avanzado de control de acceso
├── controllers/
│   ├── AuthController.ts           # Controlador de autenticación
│   └── RoleBasedController.ts      # Ejemplos de lógica basada en roles
├── routes/
│   ├── authRoutes.ts               # Rutas de autenticación
│   └── protectedRoutes.ts          # Rutas con control de acceso avanzado
└── utils/auth.ts                   # Utilidades de autenticación
```

## 👥 Roles de Usuario

### Jerarquía de Roles

```typescript
enum UserRole {
  ADMIN = 'admin',        // Acceso completo al sistema
  MODERATOR = 'moderator', // Gestión de contenido y usuarios
  USER = 'user',          // Usuario estándar
  GUEST = 'guest'         // Acceso limitado de lectura
}
```

### Descripción de Roles

| Rol | Descripción | Capacidades Principales |
|-----|-------------|------------------------|
| **ADMIN** | Administrador del sistema | • Acceso completo<br>• Gestión de usuarios<br>• Configuración del sistema<br>• Analytics completos |
| **MODERATOR** | Moderador de contenido | • Moderación de contenido<br>• Gestión limitada de usuarios<br>• Reportes y analytics<br>• Herramientas de moderación |
| **USER** | Usuario registrado | • Crear contenido<br>• Editar contenido propio<br>• Interacciones sociales<br>• Perfil personal |
| **GUEST** | Invitado | • Solo lectura<br>• Navegación limitada<br>• Sin creación de contenido |

## 🔐 Sistema de Permisos

### Permisos Disponibles

```typescript
enum Permission {
  // Gestión de usuarios
  CREATE_USER = 'create_user',
  READ_USER = 'read_user',
  UPDATE_USER = 'update_user',
  DELETE_USER = 'delete_user',
  MANAGE_USER_ROLES = 'manage_user_roles',
  
  // Gestión de contenido
  CREATE_CONTENT = 'create_content',
  READ_CONTENT = 'read_content',
  UPDATE_CONTENT = 'update_content',
  DELETE_CONTENT = 'delete_content',
  MODERATE_CONTENT = 'moderate_content',
  
  // Sistema y administración
  VIEW_ANALYTICS = 'view_analytics',
  MANAGE_SYSTEM = 'manage_system',
  ACCESS_ADMIN_PANEL = 'access_admin_panel',
  
  // Moderación específica
  BAN_USERS = 'ban_users',
  DELETE_COMMENTS = 'delete_comments',
  EDIT_ANY_CONTENT = 'edit_any_content',
}
```

### Matriz de Permisos por Rol

| Permiso | ADMIN | MODERATOR | USER | GUEST |
|---------|-------|-----------|------|-------|
| CREATE_USER | ✅ | ❌ | ❌ | ❌ |
| READ_USER | ✅ | ✅ | ✅ | ❌ |
| UPDATE_USER | ✅ | ✅ | ⚠️* | ❌ |
| DELETE_USER | ✅ | ❌ | ❌ | ❌ |
| MANAGE_USER_ROLES | ✅ | ❌ | ❌ | ❌ |
| CREATE_CONTENT | ✅ | ✅ | ✅ | ❌ |
| READ_CONTENT | ✅ | ✅ | ✅ | ✅ |
| UPDATE_CONTENT | ✅ | ✅ | ⚠️* | ❌ |
| DELETE_CONTENT | ✅ | ✅ | ⚠️* | ❌ |
| MODERATE_CONTENT | ✅ | ✅ | ❌ | ❌ |
| VIEW_ANALYTICS | ✅ | ✅ | ❌ | ❌ |
| MANAGE_SYSTEM | ✅ | ❌ | ❌ | ❌ |
| ACCESS_ADMIN_PANEL | ✅ | ❌ | ❌ | ❌ |
| BAN_USERS | ✅ | ✅ | ❌ | ❌ |

*⚠️ Solo contenido propio*

## 🛡️ Middlewares Disponibles

### Middlewares Básicos

```typescript
// Autenticación requerida
authenticateToken

// Autenticación opcional
optionalAuth

// Verificación de roles específicos
requireRole(UserRole.ADMIN, UserRole.MODERATOR)
requireAdmin
requireAdminOrModerator
requireAuth
```

### Middlewares Avanzados

```typescript
// Verificación de permisos específicos
requirePermissions(Permission.CREATE_USER, Permission.UPDATE_USER)

// Control de acceso con múltiples condiciones
requireAccess({
  roles: [UserRole.ADMIN],
  permissions: [Permission.MANAGE_SYSTEM],
  requireOwnership: true,
  resourceOwnerField: 'userId',
  customValidator: (req) => req.user.isActive
})

// Reglas diferentes por método HTTP
requireMethodBasedAccess({
  'GET': { permissions: [Permission.READ_CONTENT] },
  'POST': { permissions: [Permission.CREATE_CONTENT] },
  'PUT': { requireOwnership: true },
  'DELETE': { roles: [UserRole.ADMIN] }
})
```

### Helpers de Acceso

```typescript
// Condiciones predefinidas
AccessRules.adminOnly()
AccessRules.adminOrModerator()
AccessRules.authenticatedUsers()
AccessRules.ownResourceOrAdmin('userId')
AccessRules.contentManagement()
AccessRules.userManagement()
AccessRules.moderation()
```

## 💡 Ejemplos de Implementación

### 1. Ruta Básica con Control de Roles

```typescript
import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middlewares/auth';

const router = Router();

// Solo administradores pueden acceder
router.get('/admin/users', 
  authenticateToken, 
  requireAdmin, 
  (req, res) => {
    // Lógica del endpoint
  }
);
```

### 2. Ruta con Permisos Específicos

```typescript
import { requirePermissions, Permission } from '../middlewares/roleBasedAccess';

// Requiere permisos específicos
router.post('/content', 
  authenticateToken,
  requirePermissions(Permission.CREATE_CONTENT),
  (req, res) => {
    // Crear contenido
  }
);
```

### 3. Ruta con Verificación de Propiedad

```typescript
import { requireAccess, AccessRules } from '../middlewares/roleBasedAccess';

// Solo el propietario o admin puede editar
router.put('/users/:id', 
  authenticateToken,
  requireAccess(AccessRules.ownResourceOrAdmin('id')),
  (req, res) => {
    // Editar usuario
  }
);
```

### 4. Lógica de Negocio con Verificación de Roles

```typescript
import { hasPermission, Permission } from '../middlewares/roleBasedAccess';

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

## 🌐 Rutas de API

### Rutas de Autenticación (`/auth`)

| Método | Endpoint | Descripción | Autenticación |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Registro de usuario | ❌ |
| POST | `/auth/login` | Inicio de sesión | ❌ |
| GET | `/auth/me` | Información del usuario actual | ✅ |
| POST | `/auth/refresh` | Renovar token | ✅ |
| POST | `/auth/logout` | Cerrar sesión | ✅ |
| PUT | `/auth/change-password` | Cambiar contraseña | ✅ |

### Rutas Protegidas (`/protected`)

#### Gestión de Usuarios
| Método | Endpoint | Roles Requeridos | Descripción |
|--------|----------|------------------|-------------|
| GET | `/protected/users` | ADMIN, MODERATOR | Listar usuarios |
| POST | `/protected/users` | ADMIN | Crear usuario |
| GET | `/protected/users/:id` | Propio o ADMIN | Obtener usuario |
| PUT | `/protected/users/:id` | Propio o ADMIN | Actualizar usuario |
| DELETE | `/protected/users/:id` | ADMIN | Eliminar usuario |

#### Gestión de Contenido
| Método | Endpoint | Roles Requeridos | Descripción |
|--------|----------|------------------|-------------|
| GET | `/protected/content` | Todos autenticados | Listar contenido |
| POST | `/protected/content` | USER, MODERATOR, ADMIN | Crear contenido |
| PUT | `/protected/content/:id` | Autor, MODERATOR, ADMIN | Actualizar contenido |
| DELETE | `/protected/content/:id` | Autor, MODERATOR, ADMIN | Eliminar contenido |

#### Moderación
| Método | Endpoint | Roles Requeridos | Descripción |
|--------|----------|------------------|-------------|
| POST | `/protected/moderation/ban/:userId` | MODERATOR, ADMIN | Banear usuario |
| DELETE | `/protected/moderation/content/:id` | MODERATOR, ADMIN | Eliminar por moderación |

#### Administración
| Método | Endpoint | Roles Requeridos | Descripción |
|--------|----------|------------------|-------------|
| GET | `/protected/admin/analytics` | ADMIN, MODERATOR | Ver estadísticas |
| GET | `/protected/admin/system` | ADMIN | Estado del sistema |
| PUT | `/protected/admin/users/:id/role` | ADMIN | Cambiar rol de usuario |

### Rutas de Demostración

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/auth/admin-only` | Ruta solo para administradores |
| GET | `/auth/moderator-area` | Área de moderadores |
| GET | `/auth/user-area` | Área de usuarios |
| GET | `/auth/role-demo` | Demostración de funcionalidades por rol |
| GET | `/protected/my-permissions` | Ver permisos del usuario actual |

## 🧪 Testing

### Ejemplos de Testing con diferentes roles

```bash
# 1. Registrar un usuario
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "firstName": "Test",
    "lastName": "User"
  }'

# 2. Login y obtener token
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'

# 3. Usar token en requests protegidos
curl -X GET http://localhost:3000/protected/my-permissions \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# 4. Probar ruta solo para admins (debería fallar con USER)
curl -X GET http://localhost:3000/auth/admin-only \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# 5. Crear contenido
curl -X POST http://localhost:3000/protected/content \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Mi primer post",
    "content": "Contenido del post...",
    "category": "general"
  }'
```

### Variables de Entorno Requeridas

```env
JWT_SECRET=tu_clave_secreta_jwt_super_segura
JWT_EXPIRES_IN=24h
NODE_ENV=development
```

## 🚀 Características Avanzadas

### 1. Validación Personalizada

```typescript
requireAccess({
  customValidator: (req) => {
    const user = req.user!;
    const resourceId = req.params.id;
    
    // Lógica personalizada de validación
    if (user.role === UserRole.ADMIN) return true;
    if (user.role === UserRole.MODERATOR && isBusinessHours()) return true;
    
    return resourceId === user.userId;
  }
})
```

### 2. Logging y Auditoría

```typescript
import { logAccess } from '../middlewares/roleBasedAccess';

// Aplicar logging automático
router.use(logAccess);

// Los logs incluyen:
// - Usuario que accede
// - IP y User-Agent
// - Ruta y método
// - Timestamp
// - Resultado del control de acceso
```

### 3. Control de Acceso Dinámico

```typescript
// En el controlador
const user = req.user!;
const permissions = getAllPermissionsForRole(user.role);

// Filtrar datos según permisos
const filteredData = filterDataByPermissions(data, permissions);

return ResponseUtil.success(res, filteredData);
```

## 📚 Recursos Adicionales

- **JWT**: Tokens sin estado para autenticación
- **bcrypt**: Hash seguro de contraseñas
- **Express Middleware**: Cadena de middlewares para control de acceso
- **TypeScript**: Tipado fuerte para mayor seguridad

## 🔧 Configuración y Despliegue

1. **Instalar dependencias**:
   ```bash
   npm install jsonwebtoken bcryptjs @types/jsonwebtoken @types/bcryptjs
   ```

2. **Configurar variables de entorno**:
   ```bash
   cp .env.example .env
   # Editar .env con tus valores
   ```

3. **Iniciar servidor**:
   ```bash
   npm run dev
   ```

4. **Probar endpoints**:
   - Usa Postman, curl o cualquier cliente HTTP
   - Incluye el token JWT en el header `Authorization: Bearer <token>`

---

Este sistema proporciona una base sólida para autenticación y autorización basada en roles, con flexibilidad para adaptarse a diferentes necesidades de negocio. 🚀
