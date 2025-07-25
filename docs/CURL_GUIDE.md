# 🌐 Guía Completa de cURL - Template API

Esta guía contiene todos los comandos curl para interactuar con la Template API, incluyendo todas las funcionalidades avanzadas.

## 📋 Requisitos Previos

1. **Servidor corriendo**: `npm run dev`
2. **Base URL**: `http://localhost:3000` (o tu configuración)
3. **Content-Type**: Siempre usar `application/json` para POST/PUT
4. **Token**: Necesario para endpoints protegidos
5. **jq**: Recomendado para formatear respuestas JSON (`brew install jq`)

## 🆕 Nuevas Funcionalidades

- ✅ **Performance Monitoring**: Métricas en tiempo real
- ✅ **Request Tracing**: Correlation IDs para seguimiento
- ✅ **API Versioning**: Soporte multi-versión
- ✅ **Background Jobs**: Tareas asíncronas
- ✅ **DTOs Avanzados**: Validación robusta
- ✅ **Paginación**: Filtros y ordenamiento avanzado

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

### Health Check Avanzado (con métricas)
```bash
curl -X GET {{BASE_URL}}/metrics/health \
  -H "Authorization: Bearer {{token}}"
```

### Información de Versiones de API
```bash
curl -X GET {{BASE_URL}}/version

# Con versión específica
curl -X GET {{BASE_URL}}/version \
  -H "Accept-Version: v1"
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

## 📊 PERFORMANCE MONITORING (Solo Admin)

### Estadísticas Generales
```bash
# Estadísticas de los últimos 5 minutos
curl -X GET {{BASE_URL}}/metrics \
  -H "Authorization: Bearer {{token}}"

# Estadísticas de los últimos 30 minutos
curl -X GET "{{BASE_URL}}/metrics?minutes=30" \
  -H "Authorization: Bearer {{token}}"
```

### Requests Más Lentos
```bash
# Top 10 requests más lentos (>1000ms)
curl -X GET {{BASE_URL}}/metrics/slow \
  -H "Authorization: Bearer {{token}}"

# Personalizar umbral y límite
curl -X GET "{{BASE_URL}}/metrics/slow?threshold=500&limit=20" \
  -H "Authorization: Bearer {{token}}"
```

### Métricas Recientes
```bash
# Últimas 50 métricas
curl -X GET {{BASE_URL}}/metrics/recent \
  -H "Authorization: Bearer {{token}}"

# Últimas 100 métricas
curl -X GET "{{BASE_URL}}/metrics/recent?limit=100" \
  -H "Authorization: Bearer {{token}}"
```

---

## 📋 BACKGROUND JOBS (Solo Admin)

### Tipos de Jobs Disponibles
```bash
curl -X GET {{BASE_URL}}/jobs/types \
  -H "Authorization: Bearer {{token}}"
```

### Programar Jobs

#### Enviar Email
```bash
curl -X POST {{BASE_URL}}/jobs/schedule \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {{token}}" \
  -d '{
    "jobType": "send-email",
    "data": {
      "to": "user@example.com",
      "subject": "Bienvenido!",
      "body": "Gracias por registrarte en nuestra plataforma"
    },
    "priority": "high"
  }'
```

#### Procesar Imagen
```bash
curl -X POST {{BASE_URL}}/jobs/schedule \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {{token}}" \
  -d '{
    "jobType": "process-image",
    "data": {
      "imageUrl": "https://example.com/image.jpg",
      "operations": ["resize", "compress"]
    },
    "delay": "2024-01-25T15:30:00Z"
  }'
```

#### Generar Reporte
```bash
curl -X POST {{BASE_URL}}/jobs/schedule \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {{token}}" \
  -d '{
    "jobType": "generate-report",
    "data": {
      "reportType": "users",
      "filters": {
        "dateFrom": "2024-01-01",
        "dateTo": "2024-01-31"
      }
    },
    "priority": "normal"
  }'
```

### Estadísticas de Jobs
```bash
curl -X GET {{BASE_URL}}/jobs/stats \
  -H "Authorization: Bearer {{token}}"
```

### Cancelar Job
```bash
curl -X DELETE {{BASE_URL}}/jobs/JOB_ID_AQUI \
  -H "Authorization: Bearer {{token}}"
```

---

## 🔢 API VERSIONING

### Métodos de Especificar Versión

#### 1. Header Accept-Version (Recomendado)
```bash
curl -X GET {{BASE_URL}}/users \
  -H "Accept-Version: v1" \
  -H "Authorization: Bearer {{token}}"
```

#### 2. Header API-Version
```bash
curl -X GET {{BASE_URL}}/users \
  -H "API-Version: v1" \
  -H "Authorization: Bearer {{token}}"
```

#### 3. URL Path
```bash
curl -X GET {{BASE_URL}}/v1/users \
  -H "Authorization: Bearer {{token}}"
```

#### 4. Query Parameter
```bash
curl -X GET "{{BASE_URL}}/users?version=v1" \
  -H "Authorization: Bearer {{token}}"
```

---

## 🔍 REQUEST TRACING

### Usar Correlation ID Personalizado
```bash
# Enviar tu propio correlation ID
curl -X GET {{BASE_URL}}/users \
  -H "X-Correlation-ID: mi-request-12345" \
  -H "Authorization: Bearer {{token}}"
```

### Headers de Respuesta Automáticos
Todas las respuestas incluyen:
- `X-Correlation-ID`: ID de correlación
- `X-Request-ID`: ID específico del request
- `API-Version`: Versión utilizada
- `Supported-Versions`: Versiones soportadas

---

## 👥 GESTIÓN DE USUARIOS (CON PAGINACIÓN Y FILTROS)

### Listar Usuarios con Paginación y Filtros
```bash
# Básico (página 1, 10 items)
curl -X GET {{BASE_URL}}/users \
  -H "Authorization: Bearer {{token}}"

# Con paginación personalizada
curl -X GET "{{BASE_URL}}/users?page=2&limit=5" \
  -H "Authorization: Bearer {{token}}"

# Con ordenamiento
curl -X GET "{{BASE_URL}}/users?sortBy=createdAt&sortOrder=desc" \
  -H "Authorization: Bearer {{token}}"

# Con búsqueda de texto
curl -X GET "{{BASE_URL}}/users?search=john" \
  -H "Authorization: Bearer {{token}}"

# Con filtros específicos
curl -X GET "{{BASE_URL}}/users?role=admin&email=admin@test.com" \
  -H "Authorization: Bearer {{token}}"

# Con filtros de fecha
curl -X GET "{{BASE_URL}}/users?createdAfter=2024-01-01&createdBefore=2024-12-31" \
  -H "Authorization: Bearer {{token}}"

# Combinando todos los filtros
curl -X GET "{{BASE_URL}}/users?page=1&limit=10&sortBy=firstName&sortOrder=asc&search=admin&role=admin&createdAfter=2024-01-01" \
  -H "Authorization: Bearer {{token}}"
```

### Crear Usuario (Solo Admin) - Con Validación Mejorada
```bash
curl -X POST {{BASE_URL}}/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {{token}}" \
  -H "Accept-Version: v1" \
  -d '{
    "email": "moderador@templateapi.com",
    "password": "Password123!",
    "firstName": "Nuevo",
    "lastName": "Moderador",
    "role": "moderator"
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": "uuid-generado",
    "email": "moderador@templateapi.com",
    "firstName": "Nuevo",
    "lastName": "Moderador",
    "fullName": "Nuevo Moderador",
    "role": "moderator",
    "createdAt": "2024-01-20T10:30:00Z",
    "updatedAt": "2024-01-20T10:30:00Z"
  },
  "meta": {
    "correlationId": "uuid-correlation",
    "timestamp": "2024-01-20T10:30:00Z",
    "version": "v1"
  }
}
```

### Ver Usuario por ID
```bash
curl -X GET {{BASE_URL}}/users/USER_ID_AQUI \
  -H "Authorization: Bearer {{token}}" \
  -H "Accept-Version: v1"
```

### Actualizar Usuario
```bash
# Actualizar información básica
curl -X PUT {{BASE_URL}}/users/USER_ID_AQUI \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {{token}}" \
  -d '{
    "firstName": "Nombre Actualizado",
    "lastName": "Apellido Actualizado"
  }'

# Cambiar rol (Solo Admin)
curl -X PUT {{BASE_URL}}/users/USER_ID_AQUI \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {{token}}" \
  -d '{
    "role": "moderator"
  }'
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

---

## 🚀 EJEMPLOS COMPLETOS DE WORKFLOW

### Flujo Completo: Setup + Performance Monitoring
```bash
#!/bin/bash
set -e

BASE_URL="http://localhost:3000"

echo "🔧 SETUP COMPLETO CON NUEVAS FUNCIONALIDADES"
echo "============================================="

# 1. Login y obtener token
echo "\n1️⃣ Obteniendo token de admin..."
TOKEN=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@templateapi.com",
    "password": "MiPassword123!"
  }' | jq -r '.data.token')

if [ "$TOKEN" = "null" ]; then
  echo "❌ Error: No se pudo obtener token. ¿Usuario admin creado?"
  exit 1
fi

echo "✅ Token obtenido: ${TOKEN:0:20}..."

# 2. Verificar versiones de API
echo "\n2️⃣ Verificando versiones de API..."
curl -s -X GET $BASE_URL/version | jq '.data.currentVersion'

# 3. Crear usuarios con paginación
echo "\n3️⃣ Creando usuarios de prueba..."
for i in {1..3}; do
  curl -s -X POST $BASE_URL/users \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Accept-Version: v1" \
    -d "{
      \"email\": \"user$i@test.com\",
      \"password\": \"Password123!\",
      \"firstName\": \"Usuario\",
      \"lastName\": \"$i\",
      \"role\": \"user\"
    }" | jq '.success'
done

# 4. Listar usuarios con filtros
echo "\n4️⃣ Listando usuarios con paginación..."
curl -s -X GET "$BASE_URL/users?page=1&limit=2&sortBy=firstName&sortOrder=asc" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Correlation-ID: test-workflow-001" | jq '.meta.pagination'

# 5. Programar jobs en background
echo "\n5️⃣ Programando jobs en background..."
JOB_ID=$(curl -s -X POST $BASE_URL/jobs/schedule \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "jobType": "send-email",
    "data": {
      "to": "test@example.com",
      "subject": "Test Email",
      "body": "Este es un email de prueba"
    },
    "priority": "normal"
  }' | jq -r '.data.jobId')

echo "📋 Job programado con ID: $JOB_ID"

# 6. Verificar estadísticas de jobs
echo "\n6️⃣ Verificando estadísticas de jobs..."
curl -s -X GET $BASE_URL/jobs/stats \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# 7. Monitorear performance
echo "\n7️⃣ Monitoreando performance..."
curl -s -X GET $BASE_URL/metrics \
  -H "Authorization: Bearer $TOKEN" | jq '.data.totalRequests'

# 8. Health check avanzado
echo "\n8️⃣ Health check avanzado..."
curl -s -X GET $BASE_URL/metrics/health \
  -H "Authorization: Bearer $TOKEN" | jq '.data.status'

echo "\n✅ Workflow completo ejecutado exitosamente!"
```

### Prueba de Validación de DTOs
```bash
#!/bin/bash

BASE_URL="http://localhost:3000"
TOKEN=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@templateapi.com","password":"MiPassword123!"}' | jq -r '.data.token')

echo "🧪 PRUEBAS DE VALIDACIÓN DE DTOS"
echo "================================"

# 1. Crear usuario con datos inválidos (debe fallar)
echo "\n1️⃣ Probando validación de email inválido..."
curl -s -X POST $BASE_URL/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "email": "email-invalido",
    "password": "123",
    "firstName": "A",
    "lastName": "B"
  }' | jq '.errors[0].constraints'

# 2. Crear usuario con password débil (debe fallar)
echo "\n2️⃣ Probando validación de password débil..."
curl -s -X POST $BASE_URL/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "email": "test@example.com",
    "password": "123",
    "firstName": "Test",
    "lastName": "User"
  }' | jq '.errors'

# 3. Filtros con parámetros inválidos
echo "\n3️⃣ Probando validación de parámetros de query..."
curl -s -X GET "$BASE_URL/users?page=0&limit=150&sortOrder=invalid" \
  -H "Authorization: Bearer $TOKEN" | jq '.errors // "Sin errores"'

echo "\n✅ Pruebas de validación completadas!"
```

### Monitoreo de Performance en Tiempo Real
```bash
#!/bin/bash

BASE_URL="http://localhost:3000"
TOKEN=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@templateapi.com","password":"MiPassword123!"}' | jq -r '.data.token')

echo "📊 MONITOREO DE PERFORMANCE EN TIEMPO REAL"
echo "=========================================="

# Función para generar carga
generate_load() {
  for i in {1..10}; do
    curl -s -X GET $BASE_URL/users \
      -H "Authorization: Bearer $TOKEN" \
      -H "X-Correlation-ID: load-test-$i" > /dev/null &
  done
  wait
}

# 1. Estado inicial
echo "\n1️⃣ Estado inicial:"
curl -s -X GET $BASE_URL/metrics \
  -H "Authorization: Bearer $TOKEN" | jq '.data | {totalRequests, averageResponseTime, errorRate}'

# 2. Generar carga
echo "\n2️⃣ Generando carga de trabajo..."
generate_load

# 3. Estado después de la carga
echo "\n3️⃣ Estado después de la carga:"
curl -s -X GET $BASE_URL/metrics \
  -H "Authorization: Bearer $TOKEN" | jq '.data | {totalRequests, averageResponseTime, errorRate}'

# 4. Requests más lentos
echo "\n4️⃣ Top 5 requests más lentos:"
curl -s -X GET "$BASE_URL/metrics/slow?limit=5" \
  -H "Authorization: Bearer $TOKEN" | jq '.data[] | {method, url, duration}'

# 5. Métricas recientes
echo "\n5️⃣ Últimas 5 métricas:"
curl -s -X GET "$BASE_URL/metrics/recent?limit=5" \
  -H "Authorization: Bearer $TOKEN" | jq '.data[] | {method, url, statusCode, duration, timestamp}'

echo "\n✅ Monitoreo completado!"
```

### Demo de API Versioning
```bash
#!/bin/bash

BASE_URL="http://localhost:3000"
TOKEN=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@templateapi.com","password":"MiPassword123!"}' | jq -r '.data.token')

echo "🔢 DEMO DE API VERSIONING"
echo "========================"

# 1. Request sin especificar versión (usa default)
echo "\n1️⃣ Request sin versión (default):"
curl -s -X GET $BASE_URL/users \
  -H "Authorization: Bearer $TOKEN" | jq '.meta.version'

# 2. Request con header Accept-Version
echo "\n2️⃣ Request con Accept-Version: v1:"
curl -s -X GET $BASE_URL/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept-Version: v1" | jq '.meta.version'

# 3. Request con header API-Version
echo "\n3️⃣ Request con API-Version: v1:"
curl -s -X GET $BASE_URL/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "API-Version: v1" | jq '.meta.version'

# 4. Request con URL path
echo "\n4️⃣ Request con URL path /v1/users:"
curl -s -X GET $BASE_URL/v1/users \
  -H "Authorization: Bearer $TOKEN" | jq '.meta.version'

# 5. Request con query parameter
echo "\n5️⃣ Request con query parameter version=v1:"
curl -s -X GET "$BASE_URL/users?version=v1" \
  -H "Authorization: Bearer $TOKEN" | jq '.meta.version'

# 6. Información de versiones
echo "\n6️⃣ Información de versiones disponibles:"
curl -s -X GET $BASE_URL/version | jq '.data.supportedVersions'

# 7. Probar versión no soportada
echo "\n7️⃣ Probando versión no soportada (v99):"
curl -s -X GET $BASE_URL/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept-Version: v99" | jq '.message'

echo "\n✅ Demo de versioning completado!"
```

---

## 📋 CHECKLIST DE FUNCIONALIDADES

### ✅ Funcionalidades Implementadas
- [x] **Performance Monitoring**: Métricas en tiempo real
- [x] **Request Tracing**: Correlation IDs automáticos
- [x] **API Versioning**: Múltiples métodos de especificación
- [x] **Background Jobs**: 7 tipos de jobs diferentes
- [x] **DTOs con Validación**: Validación robusta de entrada
- [x] **Paginación Avanzada**: Filtros, ordenamiento, búsqueda
- [x] **Response Schemas**: Respuestas estandarizadas
- [x] **Headers Automáticos**: Tracing y versioning
- [x] **Error Handling**: Errores detallados y estructurados
- [x] **Health Checks**: Básico y avanzado con métricas

### 🎯 Endpoints por Categoría

**Públicos (7):**
- GET /
- GET /saludo/:nombre
- GET /health
- GET /version
- GET /config
- POST /auth/register
- POST /auth/login

**Protegidos - Usuarios (8):**
- GET /auth/me
- POST /auth/change-password
- GET /users (con filtros avanzados)
- POST /users
- GET /users/:id
- PUT /users/:id
- GET /auth/user-area
- GET /auth/role-demo

**Solo Admin (12):**
- GET /metrics
- GET /metrics/slow
- GET /metrics/recent
- GET /metrics/health
- POST /jobs/schedule
- GET /jobs/stats
- GET /jobs/types
- DELETE /jobs/:id
- GET /auth/admin-only
- GET /db/stats
- POST /users (crear)
- PUT /users/:id/role

**Admin/Moderador (3):**
- GET /auth/moderator-area
- GET /db/users
- GET /users (listar)

### 💡 Próximas Mejoras
- [ ] **Swagger/OpenAPI**: Documentación automática
- [ ] **Tests Automatizados**: Unit e integration tests
- [ ] **Docker**: Containerización
- [ ] **CI/CD**: Pipeline de despliegue
- [ ] **Logging Estructurado**: Winston con formato JSON
- [ ] **Caching**: Redis para performance
- [ ] **File Upload**: Manejo de archivos
- [ ] **WebSockets**: Comunicación en tiempo real
- [ ] **Rate Limiting**: Por usuario/endpoint
- [ ] **Audit Logs**: Registro de acciones críticas
