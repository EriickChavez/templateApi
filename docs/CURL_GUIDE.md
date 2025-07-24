# 🌐 Guía Completa de cURL - Template API

Esta guía contiene todos los comandos curl para interactuar con la Template API.

## 📋 Requisitos Previos

1. **Servidor corriendo**: `npm run dev`
2. **Base URL**: `http://localhost:3000` (o tu configuración)
3. **Content-Type**: Siempre usar `application/json` para POST/PUT
4. **Token**: Necesario para endpoints protegidos

## 🚀 Quick Setup

### 1. Crear usuario admin
```bash
node create-admin.js
```

### 2. Variables de entorno (opcional)
```bash
export BASE_URL="http://localhost:3000"
export TOKEN=""  # Se llenará después del login
```

---

## 🌍 ENDPOINTS PÚBLICOS

### Hola Mundo
```bash
curl -X GET {{BASE_URL}}/
# o
curl -X GET http://localhost:3000/
```

### Saludo Personalizado
```bash
curl -X GET {{BASE_URL}}/saludo/Erick
# o
curl -X GET http://localhost:3000/saludo/TuNombre
```

### Health Check
```bash
curl -X GET {{BASE_URL}}/health
```

### Configuración (Solo desarrollo)
```bash
curl -X GET {{BASE_URL}}/config
```

---

## 🔐 AUTENTICACIÓN

### Registrar Usuario (Primer usuario = ADMIN automáticamente)
```bash
curl -X POST {{BASE_URL}}/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@templateapi.com",
    "password": "MiPassword123!",
    "firstName": "Admin",
    "lastName": "Principal",
    "middleName": "Sistema"
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "👑 Primer usuario registrado como ADMIN",
  "data": {
    "user": {
      "id": "uuid-generado",
      "email": "admin@templateapi.com",
      "name": "Admin Principal",
      "role": "admin",
      "isEmailVerified": true
    },
    "token": "jwt-token-aqui",
    "isFirstUser": true
  }
}
```

### Login
```bash
curl -X POST {{BASE_URL}}/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@templateapi.com",
    "password": "MiPassword123!"
  }'
```

**Guardar token automáticamente:**
```bash
TOKEN=$(curl -s -X POST {{BASE_URL}}/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@templateapi.com",
    "password": "MiPassword123!"
  }' | jq -r '.data.token')

echo "Token guardado: {{token}}"
```

### Mi Información
```bash
curl -X GET {{BASE_URL}}/auth/me \
  -H "Authorization: Bearer {{token}}"
```

### Cambiar Contraseña
```bash
curl -X POST {{BASE_URL}}/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {{token}}" \
  -d '{
    "currentPassword": "MiPassword123!",
    "newPassword": "MiNuevaPassword456!"
  }'
```

---

## 🗄️ ENDPOINTS CON INYECCIÓN DE DEPENDENCIAS

### Registrar Usuario (BD)
```bash
curl -X POST {{BASE_URL}}/db/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@templateapi.com",
    "password": "Password123!",
    "firstName": "Nuevo",
    "lastName": "Usuario"
  }'
```

### Login (BD)
```bash
curl -X POST {{BASE_URL}}/db/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@templateapi.com",
    "password": "Password123!"
  }'
```

### Mi Información (BD)
```bash
curl -X GET {{BASE_URL}}/db/me \
  -H "Authorization: Bearer {{token}}"
```

### Health Check Base de Datos
```bash
curl -X GET {{BASE_URL}}/db/health
```

### Estadísticas de Usuarios (Solo Admin)
```bash
curl -X GET {{BASE_URL}}/db/stats \
  -H "Authorization: Bearer {{token}}"
```

### Listar Usuarios (Admin/Moderador)
```bash
# Básico
curl -X GET {{BASE_URL}}/db/users \
  -H "Authorization: Bearer {{token}}"

# Con paginación
curl -X GET "{{BASE_URL}}/db/users?page=1&limit=10" \
  -H "Authorization: Bearer {{token}}"

# Con filtros
curl -X GET "{{BASE_URL}}/db/users?page=1&limit=5&role=admin&status=active&search=admin" \
  -H "Authorization: Bearer {{token}}"
```

---

## 👥 GESTIÓN DE USUARIOS

### Listar Usuarios
```bash
curl -X GET {{BASE_URL}}/users \
  -H "Authorization: Bearer {{token}}"
```

### Crear Usuario (Solo Admin)
```bash
curl -X POST {{BASE_URL}}/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {{token}}" \
  -d '{
    "email": "moderador@templateapi.com",
    "password": "Password123!",
    "firstName": "Nuevo",
    "lastName": "Moderador",
    "role": "moderator"
  }'
```

### Ver Usuario por ID
```bash
curl -X GET {{BASE_URL}}/users/USER_ID_AQUI \
  -H "Authorization: Bearer {{token}}"
```

---

## 🎭 EJEMPLOS DE ROLES

### Área Solo Admin
```bash
curl -X GET {{BASE_URL}}/auth/admin-only \
  -H "Authorization: Bearer {{token}}"
```

### Área Moderadores
```bash
curl -X GET {{BASE_URL}}/auth/moderator-area \
  -H "Authorization: Bearer {{token}}"
```

### Área Usuarios
```bash
curl -X GET {{BASE_URL}}/auth/user-area \
  -H "Authorization: Bearer {{token}}"
```

### Demo de Roles
```bash
curl -X GET {{BASE_URL}}/auth/role-demo \
  -H "Authorization: Bearer {{token}}"
```

---

## 🔧 ADMINISTRACIÓN (Solo Desarrollo)

### Reiniciar Contenedor DI
```bash
curl -X POST {{BASE_URL}}/db/container/restart \
  -H "Authorization: Bearer {{token}}"
```

---

## 📊 SCRIPTS ÚTILES

### Script completo de setup
```bash
#!/bin/bash

# Configuración
BASE_URL="http://localhost:3000"

echo "🚀 Configurando Template API..."

# 1. Registrar admin
echo "📝 Registrando usuario admin..."
REGISTER_RESPONSE=$(curl -s -X POST {{BASE_URL}}/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@templateapi.com",
    "password": "MiPassword123!",
    "firstName": "Admin",
    "lastName": "Principal"
  }')

echo "Respuesta registro: $REGISTER_RESPONSE"

# 2. Login y obtener token
echo "🔐 Haciendo login..."
TOKEN=$(curl -s -X POST {{BASE_URL}}/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@templateapi.com",
    "password": "MiPassword123!"
  }' | jq -r '.data.token')

if [ "{{token}}" != "null" ]; then
  echo "✅ Token obtenido: ${TOKEN:0:20}..."
  export TOKEN
  
  # 3. Verificar información del usuario
  echo "👤 Información del usuario:"
  curl -s -X GET {{BASE_URL}}/auth/me \
    -H "Authorization: Bearer {{token}}" | jq
    
  # 4. Health check
  echo "🏥 Health check:"
  curl -s -X GET {{BASE_URL}}/db/health | jq
  
else
  echo "❌ Error obteniendo token"
fi
```

### Test de todos los endpoints
```bash
#!/bin/bash

BASE_URL="http://localhost:3000"

echo "🧪 Testing todos los endpoints..."

# Endpoints públicos
echo "1. Testing endpoints públicos..."
curl -s {{BASE_URL}}/ | jq '.message'
curl -s {{BASE_URL}}/saludo/Test | jq '.message'
curl -s {{BASE_URL}}/health | jq '.status'

# Login para obtener token
TOKEN=$(curl -s -X POST {{BASE_URL}}/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@templateapi.com",
    "password": "MiPassword123!"
  }' | jq -r '.data.token')

if [ "{{token}}" != "null" ]; then
  echo "2. Testing endpoints protegidos..."
  
  # Auth endpoints
  curl -s -X GET {{BASE_URL}}/auth/me -H "Authorization: Bearer {{token}}" | jq '.data.name'
  curl -s -X GET {{BASE_URL}}/auth/admin-only -H "Authorization: Bearer {{token}}" | jq '.message'
  
  # DB endpoints
  curl -s -X GET {{BASE_URL}}/db/health | jq '.message'
  curl -s -X GET {{BASE_URL}}/db/stats -H "Authorization: Bearer {{token}}" | jq '.data.totalUsers'
  
  echo "✅ Test completado"
else
  echo "❌ No se pudo obtener token para testing"
fi
```

---

## 🚨 Códigos de Estado HTTP

| Código | Significado | Cuándo ocurre |
|--------|-------------|---------------|
| 200    | OK          | Operación exitosa |
| 201    | Created     | Recurso creado (registro) |
| 400    | Bad Request | Datos inválidos |
| 401    | Unauthorized | Token inválido/ausente |
| 403    | Forbidden   | Sin permisos para el recurso |
| 404    | Not Found   | Recurso no encontrado |
| 409    | Conflict    | Email ya registrado |
| 500    | Server Error| Error interno del servidor |

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
  -d '{"email":"admin@templateapi.com","password":"MiPassword123!"}'
```

### 5. Timeout personalizado
```bash
curl --max-time 10 -X GET {{BASE_URL}}/health
```

### 6. Seguir redirects
```bash
curl -L -X GET {{BASE_URL}}/some-endpoint
```

---

## 🔍 Troubleshooting

### Error: Connection refused
```bash
# Verificar que el servidor esté corriendo
curl -I http://localhost:3000
# Si falla, ejecutar: npm run dev
```

### Error: 401 Unauthorized
```bash
# Verificar que el token sea válido
echo {{token}}
# Si está vacío o expirado, hacer login nuevamente
```

### Error: Invalid JSON
```bash
# Verificar formato JSON
echo '{"email":"test@test.com","password":"123"}' | jq '.'
```

### Debugging paso a paso
```bash
# 1. Verificar conectividad
ping localhost

# 2. Verificar puerto
netstat -an | grep 3000

# 3. Verificar logs del servidor
# (Ver la consola donde corre npm run dev)

# 4. Test básico
curl -v http://localhost:3000/
```
