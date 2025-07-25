# 🔐 Guía de Autenticación y Roles

Esta guía te muestra cómo usar el sistema de autenticación con roles implementado en la API.

## 🚀 Cómo empezar

1. **Inicia el servidor:**
```bash
npm run dev
```

2. **El servidor correrá en:** `http://localhost:4000`

## 📋 Roles disponibles

- **ADMIN**: Acceso total al sistema
- **MODERATOR**: Puede moderar contenido y usuarios
- **USER**: Usuario normal con permisos básicos
- **GUEST**: Acceso limitado de solo lectura

## 🔑 1. Registro de usuario

```bash
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "AdminPass123!",
    "firstName": "Super",
    "lastName": "Admin"
  }'
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "data": {
    "user": {
      "id": "1643234567890-abc123def",
      "email": "admin@example.com",
      "name": "Super Admin",
      "role": "user",
      "status": "active",
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

## 🔓 2. Login

```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "AdminPass123!"
  }'
```

**Respuesta exitosa:**
```json
{
  "success": true,
  "message": "Login exitoso",
  "data": {
    "user": {
      "id": "1643234567890-abc123def",
      "email": "admin@example.com",
      "name": "Super Admin",
      "role": "user",
      "status": "active",
      "lastLoginAt": "2024-01-15T10:35:00.000Z",
      "isEmailVerified": false
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

## 👤 3. Obtener información del usuario actual

```bash
curl -X GET http://localhost:4000/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## 🔄 4. Renovar token

```bash
curl -X POST http://localhost:4000/auth/refresh \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## 🎭 5. Ejemplos por roles

### 🔐 Solo para Administradores

```bash
# Esta ruta fallará con "user" role
curl -X GET http://localhost:4000/auth/admin-only \
  -H "Authorization: Bearer <tu-token>"
```

**Respuesta con rol USER (403 Forbidden):**
```json
{
  "success": false,
  "message": "Acceso denegado. Roles permitidos: admin"
}
```

### 👮‍♂️ Para Administradores y Moderadores

```bash
curl -X GET http://localhost:4000/auth/moderator-area \
  -H "Authorization: Bearer <tu-token>"
```

### 👤 Para usuarios registrados (USER, MODERATOR, ADMIN)

```bash
curl -X GET http://localhost:4000/auth/user-area \
  -H "Authorization: Bearer <tu-token>"
```

### 🌍 Ruta pública con autenticación opcional

```bash
# Sin token
curl -X GET http://localhost:4000/auth/public-with-optional-user

# Con token (mostrará información adicional)
curl -X GET http://localhost:4000/auth/public-with-optional-user \
  -H "Authorization: Bearer <tu-token>"
```

### 🎬 Demo de roles

```bash
curl -X GET http://localhost:4000/auth/role-demo \
  -H "Authorization: Bearer <tu-token>"
```

## 👥 6. Gestión de usuarios (Rutas protegidas)

### Crear usuarios de demo
```bash
curl -X POST http://localhost:4000/users/demo
```

### Ver estadísticas (público)
```bash
curl -X GET http://localhost:4000/users/stats
```

### Listar usuarios (Solo Admin/Moderador)
```bash
curl -X GET http://localhost:4000/users \
  -H "Authorization: Bearer <admin-token>"
```

### Ver un usuario específico (Solo el propio usuario o Admin)
```bash
curl -X GET http://localhost:4000/users/user-id-123 \
  -H "Authorization: Bearer <tu-token>"
```

### Cambiar rol de usuario (Solo Admin)
```bash
curl -X PUT http://localhost:4000/users/user-id-123/role \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"role": "admin"}'
```

## 🧪 7. Flujo de prueba completo

### Paso 1: Crear usuarios de demo
```bash
curl -X POST http://localhost:4000/users/demo
```

### Paso 2: Registrar un nuevo usuario
```bash
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### Paso 3: Hacer login y guardar el token
```bash
# Guarda la respuesta para obtener el token
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!"
  }'
```

### Paso 4: Probar rutas por roles
```bash
# ✅ Esto funcionará (cualquier usuario autenticado)
curl -X GET http://localhost:4000/auth/user-area \
  -H "Authorization: Bearer <tu-token>"

# ❌ Esto fallará (solo admins)
curl -X GET http://localhost:4000/auth/admin-only \
  -H "Authorization: Bearer <tu-token>"
```

## 🔧 8. Cambiar roles para testing

Para probar diferentes roles, necesitas:

1. **Crear un usuario admin manualmente** (o modificar el código temporalmente)
2. **Usar el endpoint de cambio de rol** con un usuario admin
3. **Crear usuarios con diferentes roles** desde el controlador

### Ejemplo: Crear admin temporal

Modifica temporalmente `AuthController.register` para crear un admin:

```typescript
role: email === 'admin@test.com' ? UserRole.ADMIN : UserRole.USER
```

Luego registra con `admin@test.com` para obtener un token de admin.

## ❌ 9. Errores comunes

### Sin token
```json
{
  "success": false,
  "message": "Header Authorization no proporcionado"
}
```

### Token inválido
```json
{
  "success": false,
  "message": "Token inválido"
}
```

### Token expirado
```json
{
  "success": false,
  "message": "Token expirado"
}
```

### Sin permisos
```json
{
  "success": false,
  "message": "Acceso denegado. Roles permitidos: admin"
}
```

### Solo dueño del recurso
```json
{
  "success": false,
  "message": "Solo puedes acceder a tus propios recursos"
}
```

## 💡 10. Tips para desarrollo

1. **Usa Postman o Thunder Client** para hacer las pruebas más fáciles
2. **Guarda los tokens** en variables de entorno
3. **Crea diferentes usuarios** con diferentes roles para testing
4. **Revisa los logs** del servidor para ver información de autenticación
5. **El token expira en 24h** por defecto

## 🎯 11. Estructura de respuestas

Todas las respuestas siguen este formato:

```json
{
  "success": true|false,
  "message": "Descripción del resultado",
  "data": { /* datos específicos */ }
}
```

## 🔒 12. Seguridad implementada

- ✅ **JWT con expiración** (24h por defecto)
- ✅ **Passwords hasheados** con bcrypt
- ✅ **Validación de fortaleza** de contraseñas
- ✅ **Rate limiting** por IP
- ✅ **Headers de seguridad** con Helmet
- ✅ **Sanitización de inputs**
- ✅ **CORS configurado**
- ✅ **Logging de intentos** de autenticación

¡Ahora tienes un sistema completo de autenticación con roles funcionando! 🚀
