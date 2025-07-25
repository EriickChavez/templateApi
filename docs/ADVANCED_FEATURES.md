# 🚀 Advanced Features Documentation

Esta documentación cubre todas las funcionalidades avanzadas implementadas en la API template.

## 📊 Performance Monitoring

### Descripción
Sistema de monitoreo de performance que rastrea métricas en tiempo real de todas las requests.

### Endpoints Disponibles

#### GET /metrics
Obtiene estadísticas generales de performance.

**Headers requeridos:**
```
Authorization: Bearer <admin_token>
Accept-Version: v1 (opcional)
```

**Query Parameters:**
- `minutes` (number, opcional): Ventana de tiempo en minutos (default: 5)

**Ejemplo de respuesta:**
```json
{
  "success": true,
  "message": "Performance statistics retrieved",
  "data": {
    "totalRequests": 150,
    "averageResponseTime": 245,
    "errorRate": 2,
    "slowRequests": 3,
    "currentMemory": {
      "rss": 45678912,
      "heapUsed": 23456789,
      "heapTotal": 34567890,
      "external": 1234567
    },
    "timeWindow": "5 minutes"
  },
  "meta": {
    "correlationId": "uuid-here",
    "timestamp": "2024-01-20T10:30:00.000Z",
    "version": "v1"
  }
}
```

#### GET /metrics/slow
Lista los requests más lentos.

**Query Parameters:**
- `threshold` (number, opcional): Umbral en ms (default: 1000)
- `limit` (number, opcional): Límite de resultados (default: 10)

#### GET /metrics/recent
Obtiene métricas recientes detalladas.

**Query Parameters:**
- `limit` (number, opcional): Número de métricas (default: 50)

#### GET /metrics/health
Health check avanzado con métricas de sistema.

### Configuración
Las métricas se almacenan en memoria (máximo 1000). Para producción se recomienda usar Redis.

---

## 🔍 Request Tracing & Correlation IDs

### Descripción
Sistema de trazabilidad que permite seguir requests a través de toda la aplicación.

### Headers Automáticos
La API automáticamente agrega estos headers a todas las respuestas:
- `X-Correlation-ID`: ID único para el request
- `X-Request-ID`: ID específico del request actual

### Uso
Puedes enviar tu propio correlation ID:
```bash
curl -H "X-Correlation-ID: my-custom-id" http://localhost:3000/users
```

### Logs Estructurados
Todos los logs incluyen información de tracing:
```
[correlation-id] GET /users - 200 (245ms)
```

---

## 🔢 API Versioning

### Descripción
Sistema de versionado flexible que soporta múltiples métodos de especificación.

### Métodos de Versionado

#### 1. Header Accept-Version (Recomendado)
```bash
curl -H "Accept-Version: v1" http://localhost:3000/users
```

#### 2. Header API-Version
```bash
curl -H "API-Version: v1" http://localhost:3000/users
```

#### 3. URL Path
```bash
curl http://localhost:3000/v1/users
```

#### 4. Query Parameter
```bash
curl http://localhost:3000/users?version=v1
```

### Versiones Soportadas
- **v1**: Versión actual (default)
- **v2**: Próxima versión (en desarrollo)

### Endpoint de Información
#### GET /version
Obtiene información detallada sobre versiones.

**Ejemplo de respuesta:**
```json
{
  "success": true,
  "message": "API version information",
  "data": {
    "currentVersion": "v1",
    "defaultVersion": "v1",
    "supportedVersions": {
      "v1": {
        "version": "v1",
        "deprecated": false
      },
      "v2": {
        "version": "v2",
        "deprecated": false
      }
    },
    "requestInfo": {
      "detectedVersion": "v1",
      "versionSource": "Default version"
    }
  }
}
```

### Deprecación
Cuando una versión se depreca, la API retorna headers especiales:
- `Deprecation: true`
- `Deprecation-Date: 2024-06-01`
- `Sunset: 2024-12-01`

---

## 📋 Background Jobs

### Descripción
Sistema de tareas en background usando Agenda.js para operaciones asíncronas.

### Tipos de Jobs Disponibles
- `send-email`: Envío de emails
- `process-image`: Procesamiento de imágenes
- `cleanup-temp-files`: Limpieza de archivos temporales
- `generate-report`: Generación de reportes
- `sync-database`: Sincronización de BD
- `send-notification`: Notificaciones push
- `backup-data`: Respaldo de datos

### Endpoints

#### POST /jobs/schedule
Programa un nuevo job.

**Body ejemplo:**
```json
{
  "jobType": "send-email",
  "data": {
    "to": "user@example.com",
    "subject": "Welcome!",
    "body": "Welcome to our platform"
  },
  "priority": "high",
  "delay": "2024-01-20T15:30:00Z"
}
```

#### GET /jobs/stats
Obtiene estadísticas de jobs.

#### GET /jobs/types  
Lista tipos de jobs disponibles.

#### DELETE /jobs/:id
Cancela un job programado.

### Jobs Recurrentes
Automáticamente programados:
- Limpieza de archivos: Diario a las 2 AM
- Sincronización BD: Cada 6 horas

---

## 📝 DTOs y Validación

### Descripción
Sistema robusto de validación usando class-validator y class-transformer.

### DTOs Principales

#### UserDto
```typescript
// Crear usuario
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "user" // opcional
}

// Filtrar usuarios
{
  "page": 1,
  "limit": 10,
  "sortBy": "createdAt",
  "sortOrder": "desc",
  "search": "john",
  "email": "user@example.com",
  "role": "user",
  "createdAfter": "2024-01-01",
  "createdBefore": "2024-12-31"
}
```

### Validaciones Automáticas
- Tipos de datos
- Longitudes mínimas/máximas
- Formatos (email, UUID, fechas)
- Enums (roles)
- Sanitización automática

### Respuestas Estandarizadas
Todas las respuestas siguen este formato:
```json
{
  "success": boolean,
  "message": string,
  "data": any,
  "meta": {
    "timestamp": "ISO date",
    "correlationId": "uuid",
    "version": "v1",
    "pagination": {} // si aplica
  },
  "errors": [] // si hay errores
}
```

---

## 📄 Paginación y Filtrado

### Descripción
Sistema estandarizado de paginación con filtros avanzados y ordenamiento.

### Parámetros de Query

#### Paginación
- `page` (number): Página actual (default: 1)
- `limit` (number): Items por página (default: 10, max: 100)

#### Ordenamiento
- `sortBy` (string): Campo para ordenar
- `sortOrder` (enum): `asc` o `desc` (default: asc)

#### Búsqueda
- `search` (string): Búsqueda de texto libre

#### Filtros Específicos (Users)
- `email` (string): Filtrar por email
- `role` (enum): Filtrar por rol
- `firstName` (string): Filtrar por nombre
- `lastName` (string): Filtrar por apellido
- `createdAfter` (date): Creados después de fecha
- `createdBefore` (date): Creados antes de fecha

### Ejemplo de Request
```bash
curl "http://localhost:3000/users?page=2&limit=5&sortBy=createdAt&sortOrder=desc&search=john&role=user"
```

### Ejemplo de Respuesta Paginada
```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user",
      "fullName": "John Doe",
      "createdAt": "2024-01-20T10:30:00Z",
      "updatedAt": "2024-01-20T10:30:00Z"
    }
  ],
  "meta": {
    "pagination": {
      "currentPage": 2,
      "itemsPerPage": 5,
      "totalItems": 25,
      "totalPages": 5,
      "hasNextPage": true,
      "hasPreviousPage": true
    },
    "correlationId": "uuid-here",
    "timestamp": "2024-01-20T10:30:00Z",
    "version": "v1"
  }
}
```

---

## 🔧 Configuración Avanzada

### Variables de Entorno Adicionales
```bash
# Performance monitoring
PERFORMANCE_SLOW_THRESHOLD=1000
PERFORMANCE_MAX_METRICS=1000

# Request tracing
ENABLE_TRACING=true
LOG_LEVEL=info

# API Versioning
DEFAULT_API_VERSION=v1
SUPPORTED_VERSIONS=v1,v2

# Background Jobs (requiere DATABASE_URL)
JOB_CONCURRENCY=5
JOB_PROCESS_INTERVAL=10000
```

### Headers de Respuesta Automáticos
Todas las respuestas incluyen:
- `X-Correlation-ID`: ID de correlación
- `X-Request-ID`: ID del request
- `API-Version`: Versión utilizada
- `Supported-Versions`: Versiones soportadas

---

## 🚨 Consideraciones de Producción

### Performance Monitoring
- Usar Redis para almacenar métricas
- Configurar alertas para requests lentos
- Monitorear uso de memoria

### Request Tracing
- Integrar con sistemas como Jaeger o Zipkin
- Usar structured logging (Winston)
- Configurar log rotation

### API Versioning
- Planificar deprecaciones con suficiente tiempo
- Documentar cambios breaking
- Usar semantic versioning

### Background Jobs
- Configurar clustering para alta disponibilidad
- Monitorear cola de jobs
- Implementar retry policies

### DTOs y Validación
- Mantener DTOs actualizados con cambios de esquema
- Validar también en el lado del cliente
- Documentar todos los campos requeridos

---

## 🔍 Debugging y Troubleshooting

### Logs Estructurados
Buscar por correlation ID:
```bash
grep "correlation-id-here" logs/*.log
```

### Performance Issues
Revisar métricas de slow requests:
```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/metrics/slow
```

### Jobs Fallidos
Revisar estadísticas de jobs:
```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/jobs/stats
```

### Validación de DTOs
Los errores de validación incluyen detalles específicos del campo y constraint violado.
