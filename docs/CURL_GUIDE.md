# 🌐 Guía Completa de cURL - Template API

Esta guía contiene **TODOS** los comandos curl para interactuar con la Template API, incluyendo todas las funcionalidades avanzadas y todos los endpoints disponibles.

> 🤖 **Generado automáticamente** el 2025-07-26T19:24:24.285Z
> 
> Para actualizar esta guía, ejecuta: `npm run generate:curl-guide`

## 📋 Requisitos Previos

1. **Servidor corriendo**: `npm run dev`
2. **Base URL**: `http://localhost:4000` (o tu configuración)
3. **Content-Type**: Siempre usar `application/json` para POST/PUT
4. **Token**: Necesario para endpoints protegidos
5. **jq**: Recomendado para formatear respuestas JSON (`brew install jq`)

## 🚀 Quick Setup

### 1. Variables de entorno
```bash
export BASE_URL="http://localhost:4000"
export TOKEN=""  # Se llenará después del login
```

---

## 🌍 ENDPOINTS PÚBLICOS

### GET /
@access  Public
```bash
curl -X GET {{BASE_URL}}/
```


### GET /auth/public-with-optional-user
/
```bash
curl -X GET {{BASE_URL}}/auth/public-with-optional-user
```


### GET /config
/
```bash
curl -X GET {{BASE_URL}}/config
```


### GET /db/health
/
```bash
curl -X GET {{BASE_URL}}/db/health
```


### GET /health
/
```bash
curl -X GET {{BASE_URL}}/health
```


### GET /jobs/stats
GET /jobs/stats - Estadísticas de jobs
```bash
curl -X GET {{BASE_URL}}/jobs/stats
```


### GET /jobs/types
GET /jobs/types - Obtener tipos de jobs disponibles
```bash
curl -X GET {{BASE_URL}}/jobs/types
```


### GET /metrics/health
GET /metrics/recent - Métricas recientes
```bash
curl -X GET {{BASE_URL}}/metrics/health
```


### GET /metrics/performance
GET /metrics/health - Health check avanzado con métricas
```bash
curl -X GET {{BASE_URL}}/metrics/performance
```


### GET /metrics/recent
GET /metrics/slow - Requests más lentos
```bash
curl -X GET {{BASE_URL}}/metrics/recent
```


### GET /metrics/slow
GET /metrics - Estadísticas generales de performance
```bash
curl -X GET {{BASE_URL}}/metrics/slow
```


### GET /metrics/system
GET /metrics/performance - Detalles de performance
```bash
curl -X GET {{BASE_URL}}/metrics/system
```


### GET /protected/my-permissions
===== RUTA DE DEMOSTRACIÓN DE PERMISOS =====
```bash
curl -X GET {{BASE_URL}}/protected/my-permissions
```


### GET /saludo/:nombre
/
```bash
curl -X GET {{BASE_URL}}/saludo/:nombre
```


### GET /users/:id
Acceso: Admin puede ver cualquiera, usuarios normales solo el suyo
```bash
curl -X GET {{BASE_URL}}/users/:id
```


### GET /users/stats
/
```bash
curl -X GET {{BASE_URL}}/users/stats
```


### GET /version/
GET /version - Información de versiones de API
```bash
curl -X GET {{BASE_URL}}/version/
```


### POST /auth/login
/
```bash
curl -X POST {{BASE_URL}}/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{
  "email": "user@example.com",
  "password": "Password123!"
}'
```


### POST /auth/register
===== RUTAS PÚBLICAS (sin autenticación) =====
```bash
curl -X POST {{BASE_URL}}/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{
  "email": "user@example.com",
  "password": "Password123!",
  "firstName": "Nombre",
  "lastName": "Apellido"
}'
```


### POST /db/login
/
```bash
curl -X POST {{BASE_URL}}/db/login \\
  -H "Content-Type: application/json"
```


### POST /db/register
===== RUTAS PÚBLICAS =====
```bash
curl -X POST {{BASE_URL}}/db/register \\
  -H "Content-Type: application/json"
```


### POST /jobs/schedule
Todas las rutas de jobs requieren autenticación y rol de admin
```bash
curl -X POST {{BASE_URL}}/jobs/schedule \\
  -H "Content-Type: application/json"
```


### POST /test-error
/
```bash
curl -X POST {{BASE_URL}}/test-error \\
  -H "Content-Type: application/json"
```


### POST /users/demo
===== RUTAS PÚBLICAS =====
```bash
curl -X POST {{BASE_URL}}/users/demo \\
  -H "Content-Type: application/json" \\
  -d '{
  "email": "newuser@example.com",
  "password": "Password123!",
  "firstName": "Nuevo",
  "lastName": "Usuario",
  "role": "user"
}'
```


### PUT /auth/change-role
/
```bash
curl -X PUT {{BASE_URL}}/auth/change-role \\
  -H "Content-Type: application/json"
```


### PUT /users/:id
Acceso: Admin puede ver cualquiera, usuarios normales solo el suyo
```bash
curl -X PUT {{BASE_URL}}/users/:id \\
  -H "Content-Type: application/json" \\
  -d '{
  "email": "newuser@example.com",
  "password": "Password123!",
  "firstName": "Nuevo",
  "lastName": "Usuario",
  "role": "user"
}'
```


### DELETE /jobs/:id
DELETE /jobs/:id - Cancelar un job
```bash
curl -X DELETE {{BASE_URL}}/jobs/:id
```


---

## 🔐 AUTENTICACIÓN

### GET /auth/admin-only
===== RUTAS DE EJEMPLO POR ROLES =====
**Requiere**: admin
```bash
curl -X GET {{BASE_URL}}/auth/admin-only \\
  -H "Authorization: Bearer {{token}}"
```


### GET /auth/guest-allowed
/
**Requiere**: authenticated
```bash
curl -X GET {{BASE_URL}}/auth/guest-allowed \\
  -H "Authorization: Bearer {{token}}"
```


### GET /auth/me
===== RUTAS PROTEGIDAS (requieren autenticación) =====
**Requiere**: authenticated
```bash
curl -X GET {{BASE_URL}}/auth/me \\
  -H "Authorization: Bearer {{token}}"
```


### GET /auth/moderator-area
/
**Requiere**: admin
```bash
curl -X GET {{BASE_URL}}/auth/moderator-area \\
  -H "Authorization: Bearer {{token}}"
```


### GET /auth/role-demo
===== RUTAS DE DEMOSTRACIÓN DE ROLES =====
**Requiere**: authenticated
```bash
curl -X GET {{BASE_URL}}/auth/role-demo \\
  -H "Authorization: Bearer {{token}}"
```


### GET /auth/user-area
/
**Requiere**: authenticated
```bash
curl -X GET {{BASE_URL}}/auth/user-area \\
  -H "Authorization: Bearer {{token}}"
```


### POST /auth/logout
/
**Requiere**: authenticated
```bash
curl -X POST {{BASE_URL}}/auth/logout \\
  -H "Authorization: Bearer {{token}}" \\
  -H "Content-Type: application/json"
```


### POST /auth/refresh
/
**Requiere**: authenticated
```bash
curl -X POST {{BASE_URL}}/auth/refresh \\
  -H "Authorization: Bearer {{token}}" \\
  -H "Content-Type: application/json"
```


### PUT /auth/change-password
/
**Requiere**: authenticated
```bash
curl -X PUT {{BASE_URL}}/auth/change-password \\
  -H "Authorization: Bearer {{token}}" \\
  -H "Content-Type: application/json" \\
  -d '{
  "currentPassword": "Password123!",
  "newPassword": "NewPassword456!"
}'
```


---

## 🗄️ BASE DE DATOS

### GET /db/me
===== RUTAS PROTEGIDAS =====
**Requiere**: authenticated
```bash
curl -X GET {{BASE_URL}}/db/me \\
  -H "Authorization: Bearer {{token}}"
```


### GET /db/stats
/
**Requiere**: admin
```bash
curl -X GET {{BASE_URL}}/db/stats \\
  -H "Authorization: Bearer {{token}}"
```


### GET /db/users
/
**Requiere**: admin
```bash
curl -X GET {{BASE_URL}}/db/users \\
  -H "Authorization: Bearer {{token}}"
```


### POST /db/change-password
/
**Requiere**: authenticated
```bash
curl -X POST {{BASE_URL}}/db/change-password \\
  -H "Authorization: Bearer {{token}}" \\
  -H "Content-Type: application/json"
```


### POST /db/container/restart
===== RUTAS DE ADMINISTRACIÓN (Solo desarrollo) =====
**Requiere**: admin
```bash
curl -X POST {{BASE_URL}}/db/container/restart \\
  -H "Authorization: Bearer {{token}}" \\
  -H "Content-Type: application/json"
```


---

## 👥 GESTIÓN DE USUARIOS

### GET /users/
Middleware de autenticación para todas las rutas
**Requiere**: authenticated
```bash
curl -X GET {{BASE_URL}}/users/ \\
  -H "Authorization: Bearer {{token}}"
```


### GET /users/:id/permissions/:action
/
**Requiere**: authenticated
```bash
curl -X GET {{BASE_URL}}/users/:id/permissions/:action \\
  -H "Authorization: Bearer {{token}}"
```


### POST /users/
Middleware de autenticación para todas las rutas
**Requiere**: authenticated
```bash
curl -X POST {{BASE_URL}}/users/ \\
  -H "Authorization: Bearer {{token}}" \\
  -H "Content-Type: application/json" \\
  -d '{
  "email": "newuser@example.com",
  "password": "Password123!",
  "firstName": "Nuevo",
  "lastName": "Usuario",
  "role": "user"
}'
```


### PUT /users/:id/email
/
**Requiere**: authenticated
```bash
curl -X PUT {{BASE_URL}}/users/:id/email \\
  -H "Authorization: Bearer {{token}}" \\
  -H "Content-Type: application/json" \\
  -d '{
  "email": "newuser@example.com",
  "password": "Password123!",
  "firstName": "Nuevo",
  "lastName": "Usuario",
  "role": "user"
}'
```


### PUT /users/:id/role
/
**Requiere**: admin
```bash
curl -X PUT {{BASE_URL}}/users/:id/role \\
  -H "Authorization: Bearer {{token}}" \\
  -H "Content-Type: application/json" \\
  -d '{
  "email": "newuser@example.com",
  "password": "Password123!",
  "firstName": "Nuevo",
  "lastName": "Usuario",
  "role": "user"
}'
```


### PUT /users/:id/toggle-status
/
**Requiere**: admin
```bash
curl -X PUT {{BASE_URL}}/users/:id/toggle-status \\
  -H "Authorization: Bearer {{token}}" \\
  -H "Content-Type: application/json" \\
  -d '{
  "email": "newuser@example.com",
  "password": "Password123!",
  "firstName": "Nuevo",
  "lastName": "Usuario",
  "role": "user"
}'
```


---

## 📊 PERFORMANCE MONITORING

### GET /metrics/
Todas las rutas de métricas requieren autenticación y rol de admin
**Requiere**: authenticated
```bash
curl -X GET {{BASE_URL}}/metrics/ \\
  -H "Authorization: Bearer {{token}}"
```


---

## 🔒 RUTAS PROTEGIDAS

### GET /protected/admin/analytics
===== RUTAS ADMINISTRATIVAS =====
```bash
curl -X GET {{BASE_URL}}/protected/admin/analytics \\
  -H "Authorization: Bearer {{token}}"
```


### GET /protected/admin/system
/
```bash
curl -X GET {{BASE_URL}}/protected/admin/system \\
  -H "Authorization: Bearer {{token}}"
```


### GET /protected/content
===== RUTAS DE GESTIÓN DE CONTENIDO =====
```bash
curl -X GET {{BASE_URL}}/protected/content \\
  -H "Authorization: Bearer {{token}}"
```


### GET /protected/users
===== RUTAS DE GESTIÓN DE USUARIOS =====
```bash
curl -X GET {{BASE_URL}}/protected/users \\
  -H "Authorization: Bearer {{token}}"
```


### GET /protected/users/:id
/
```bash
curl -X GET {{BASE_URL}}/protected/users/:id \\
  -H "Authorization: Bearer {{token}}"
```


### POST /protected/content
===== RUTAS DE GESTIÓN DE CONTENIDO =====
```bash
curl -X POST {{BASE_URL}}/protected/content \\
  -H "Authorization: Bearer {{token}}" \\
  -H "Content-Type: application/json"
```


### POST /protected/moderation/ban/:userId
===== RUTAS DE MODERACIÓN =====
```bash
curl -X POST {{BASE_URL}}/protected/moderation/ban/:userId \\
  -H "Authorization: Bearer {{token}}" \\
  -H "Content-Type: application/json"
```


### POST /protected/users
===== RUTAS DE GESTIÓN DE USUARIOS =====
```bash
curl -X POST {{BASE_URL}}/protected/users \\
  -H "Authorization: Bearer {{token}}" \\
  -H "Content-Type: application/json" \\
  -d '{
  "email": "newuser@example.com",
  "password": "Password123!",
  "firstName": "Nuevo",
  "lastName": "Usuario",
  "role": "user"
}'
```


### PUT /protected/admin/users/:id/role
/
```bash
curl -X PUT {{BASE_URL}}/protected/admin/users/:id/role \\
  -H "Authorization: Bearer {{token}}" \\
  -H "Content-Type: application/json" \\
  -d '{
  "email": "newuser@example.com",
  "password": "Password123!",
  "firstName": "Nuevo",
  "lastName": "Usuario",
  "role": "user"
}'
```


### PUT /protected/content/:id
/
```bash
curl -X PUT {{BASE_URL}}/protected/content/:id \\
  -H "Authorization: Bearer {{token}}" \\
  -H "Content-Type: application/json"
```


### PUT /protected/users/:id
/
```bash
curl -X PUT {{BASE_URL}}/protected/users/:id \\
  -H "Authorization: Bearer {{token}}" \\
  -H "Content-Type: application/json" \\
  -d '{
  "email": "newuser@example.com",
  "password": "Password123!",
  "firstName": "Nuevo",
  "lastName": "Usuario",
  "role": "user"
}'
```


### DELETE /protected/content/:id
/
```bash
curl -X DELETE {{BASE_URL}}/protected/content/:id \\
  -H "Authorization: Bearer {{token}}"
```


### DELETE /protected/moderation/content/:contentId
/
```bash
curl -X DELETE {{BASE_URL}}/protected/moderation/content/:contentId \\
  -H "Authorization: Bearer {{token}}"
```


### DELETE /protected/users/:id
/
```bash
curl -X DELETE {{BASE_URL}}/protected/users/:id \\
  -H "Authorization: Bearer {{token}}"
```


### /RESOURCES/:ID /protectedget
/
```bash
curl -X /RESOURCES/:ID {{BASE_URL}}/protectedget \\
  -H "Authorization: Bearer {{token}}"
```


---


## 📊 RESUMEN DE ENDPOINTS

### Por Categoría
- **ENDPOINTS PÚBLICOS**: 27 endpoints
- **AUTENTICACIÓN**: 9 endpoints
- **BASE DE DATOS**: 5 endpoints
- **GESTIÓN DE USUARIOS**: 6 endpoints
- **PERFORMANCE MONITORING**: 1 endpoints
- **RUTAS PROTEGIDAS**: 15 endpoints


### Por Nivel de Acceso
- **public**: 42 endpoints
- **authenticated**: 14 endpoints
- **admin**: 7 endpoints


---

## 💡 Tips y Trucos

### 1. Formatear respuestas JSON
```bash
curl -s {{BASE_URL}}/health | jq '.'
```

### 2. Guardar respuestas en archivo
```bash
curl -s {{BASE_URL}}/auth/me -H "Authorization: Bearer {{token}}" > user_info.json
```

### 3. Mostrar headers de respuesta
```bash
curl -i -X GET {{BASE_URL}}/health
```

### 4. Modo verbose para debugging
```bash
curl -v -X POST {{BASE_URL}}/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Password123!"}'
```

---

## 🔍 Troubleshooting

### Error: Connection refused
```bash
# Verificar que el servidor esté corriendo
curl -I http://localhost:4000
# Si falla, ejecutar: npm run dev
```

### Error: 401 Unauthorized
```bash
# Verificar que el token sea válido
echo $TOKEN
# Si está vacío o expirado, hacer login nuevamente
```

---

## 🤖 Generación Automática

Esta guía se genera automáticamente analizando el código fuente. Para actualizarla:

```bash
npm run generate:curl-guide
```

El script analiza los siguientes archivos:
- `appRoutes.ts`
- `authRoutes.ts`
- `databaseAuthRoutes.ts`
- `enhancedUserRoutes.ts`
- `index.ts`
- `jobRoutes.ts`
- `metricsRoutes.ts`
- `protectedRoutes.ts`
- `userRoutes.ts`
- `versionRoutes.ts`

---

> 📅 **Última actualización**: 2025-07-26T19:24:24.285Z
> 
> 🔄 **Total de endpoints**: 63
