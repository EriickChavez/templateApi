Claro, aquí tienes todos los comandos `curl` equivalentes a los endpoints de tu colección de Postman:

**🌍 ENDPOINTS PÚBLICOS**

```bash
# Hola Mundo
curl -X GET {{baseUrl}}/

# Saludo Personalizado
curl -X GET {{baseUrl}}/saludo/Erick

# Health Check
curl -X GET {{baseUrl}}/health

# Configuración (Solo Dev)
curl -X GET {{baseUrl}}/config
```

**🔐 AUTENTICACIÓN**

```bash
# Registrar Usuario
curl -X POST {{baseUrl}}/auth/register \
  -H "Content-Type: application/json" \
  -d '{
  "email": "admin@templateapi.com",
  "password": "MiPassword123!",
  "firstName": "Admin",
  "lastName": "Principal",
  "middleName": "Sistema"
}'

# Login
curl -X POST {{baseUrl}}/auth/login \
  -H "Content-Type: application/json" \
  -d '{
  "email": "admin@templateapi.com",
  "password": "MiPassword123!"
}'

# Mi Información (requiere token)
curl -X GET {{baseUrl}}/auth/me \
  -H "Authorization: Bearer TU_TOKEN_AQUI"

# Cambiar Contraseña (requiere token)
curl -X POST {{baseUrl}}/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -d '{
  "currentPassword": "MiPassword123!",
  "newPassword": "MiNuevaPassword456!"
}'

# Health Check Base de Datos (requiere token)
curl -X GET {{baseUrl}}/auth/health \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

**👥 GESTIÓN DE USUARIOS**

```bash
# Listar Usuarios (requiere token)
curl -X GET "{{baseUrl}}/users?page=1&limit=10" \
  -H "Authorization: Bearer TU_TOKEN_AQUI"

# Crear Usuario (requiere token)
curl -X POST {{baseUrl}}/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -d '{
  "email": "usuario@templateapi.com",
  "password": "Password123!",
  "firstName": "Nuevo",
  "lastName": "Usuario",
  "role": "user"
}'

# Ver Usuario por ID (requiere token)
curl -X GET {{baseUrl}}/users/USER_ID_AQUI \
  -H "Authorization: Bearer TU_TOKEN_AQUI"

# Estadísticas de Usuarios (requiere token)
curl -X GET {{baseUrl}}/auth/stats \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

**🎭 EJEMPLOS DE ROLES**

```bash
# Área Solo Admin (requiere token de admin)
curl -X GET {{baseUrl}}/auth/admin-only \
  -H "Authorization: Bearer TU_TOKEN_AQUI"

# Área Moderadores (requiere token de admin/moderador)
curl -X GET {{baseUrl}}/auth/moderator-area \
  -H "Authorization: Bearer TU_TOKEN_AQUI"

# Área Usuarios (requiere token válido)
curl -X GET {{baseUrl}}/auth/user-area \
  -H "Authorization: Bearer TU_TOKEN_AQUI"

# Demo de Roles (requiere token)
curl -X GET {{baseUrl}}/auth/role-demo \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

**🔧 ADMINISTRACIÓN (Solo Dev)**

```bash
# Reiniciar Contenedor DI (requiere token)
curl -X POST {{baseUrl}}/auth/container/restart \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

**Instrucciones:**

1.  **Reemplaza `{{baseUrl}}`** con la URL base real de tu API (por ejemplo, `http://localhost:4000`).
2.  **Reemplaza `TU_TOKEN_AQUI`** con el token JWT que obtengas después de iniciar sesión o registrarte.
3.  **Reemplaza `USER_ID_AQUI`** con el ID real del usuario que quieras consultar.

Estos comandos representan las llamadas básicas. Para operaciones más complejas como filtros en la paginación de usuarios, simplemente añade los parámetros de consulta a la URL como se muestra en el ejemplo de "Listar Usuarios".