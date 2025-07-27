# 🚀 Template API - Sistema de Autenticación con Inyección de Dependencias

Una API completa con autenticación JWT, control de roles y arquitectura hexagonal con inyección de dependencias que soporta múltiples bases de datos.

## ✨ Características

- 🏗️ **Arquitectura Hexagonal** con inyección de dependencias
- 🔐 **Autenticación JWT** completa con roles
- 🗄️ **Multi-Base de Datos**: InMemory, MongoDB, MySQL
- 🛡️ **Sistema de Seguridad** robusto con rate limiting
- 👥 **Control de Roles**: Admin, Moderator, User, Guest
- 📊 **Health Checks** y monitoreo integrado
- 🧪 **Repositorio en Memoria** para desarrollo rápido
- 📝 **Documentación completa** con ejemplos curl
- 🎯 **Colección Postman** incluida
- 📚 **Documentación Swagger/OpenAPI** interactiva
- 🧼 **Sanitización Avanzada** (XSS, SQL/NoSQL Injection, Path Traversal)
- 🔍 **Búsqueda y Filtrado** con Elasticsearch + Fuse.js

## 🚀 Quick Start

### 1. Instalación
```bash
git clone https://github.com/EriickChavez/templateApi.git
cd templateApi
npm install
```

### 2. Configuración
```bash
# Copia el archivo de ejemplo
cp .env.example .env

# Para desarrollo rápido (repositorio en memoria):
# Deja DATABASE_URL comentada en .env

# Para persistencia, descomenta y configura:
# DATABASE_URL=mongodb://localhost:27017/templateapi
# o
# DATABASE_URL=mysql://root:password@localhost:3306/templateapi
```

### 3. Crear Usuario Admin
```bash
node create-admin.js
# Sigue las instrucciones interactivas
```

### 4. Ejecutar
```bash
npm run dev
```

🎉 **¡Listo!** Tu API estará corriendo en `http://localhost:4000`

## 📚 Documentación

| Documento | Descripción |
|-----------|-----------|
| [📜 Guía cURL](docs/CURL_GUIDE.md) | Comandos curl para todos los endpoints |
| [🏗️ Inyección de Dependencias](docs/DEPENDENCY_INJECTION.md) | Sistema DI y configuración de BD |
| [📋 Guía Fácil](docs/EASY_GUIDE.md) | Cómo agregar endpoints nuevos |
| [🛡️ Características Avanzadas](docs/ADVANCED_SECURITY_SEARCH.md) | Sanitización, Búsqueda y Swagger |
| [📬 Postman Collection](postman/template_api_collection.json) | Colección completa para Postman |

## 🌍 Endpoints Principales

### Públicos
```
GET  /              - Hola Mundo
GET  /saludo/:nombre - Saludo personalizado
GET  /health        - Estado de la API
GET  /config        - Configuración (solo dev)
```

### Autenticación
```
POST /auth/register - Registro de usuarios
POST /auth/login    - Login
GET  /auth/me       - Información del usuario
POST /auth/change-password - Cambiar contraseña
```

### Con Inyección de Dependencias
```
POST /db/register   - Registro (BD)
POST /db/login      - Login (BD)
GET  /db/me         - Info usuario (BD)
GET  /db/health     - Health check BD
GET  /db/stats      - Estadísticas (Admin)
GET  /db/users      - Listar usuarios
```

### Gestión de Usuarios
```
GET  /users         - Listar usuarios
POST /users         - Crear usuario (Admin)
GET  /users/:id     - Ver usuario
```

### Búsqueda y Filtrado
```
GET  /search/content    - Búsqueda de contenido con full-text
GET  /search/users      - Búsqueda de usuarios
GET  /search/suggest    - Sugerencias automáticas
GET  /search/facets     - Facetas para filtrado avanzado
```

### Documentación
```
GET  /api-docs          - Swagger UI interactivo
```

## 🗄️ Bases de Datos Soportadas

### 🧠 InMemory (Desarrollo)
- **Uso**: Desarrollo y testing rápido
- **Configuración**: No configurar `DATABASE_URL`
- **Persistencia**: Datos se pierden al reiniciar
- **Ventaja**: Sin dependencias externas

### 🍃 MongoDB
```bash
# Local
DATABASE_URL=mongodb://localhost:27017/templateapi

# Atlas
DATABASE_URL=mongodb+srv://user:pass@cluster.mongodb.net/templateapi
```

### 🐬 MySQL
```bash
# Local
DATABASE_URL=mysql://root:password@localhost:3306/templateapi

# Producción con SSL
DATABASE_URL=mysql://user:pass@host:3306/templateapi?ssl=true
```

## 👥 Sistema de Roles

| Rol | Permisos | Descripción |
|-----|----------|-------------|
| **Admin** | Todos | Control total del sistema |
| **Moderator** | read, create, update, moderate | Gestión de contenido |
| **User** | read, create, update_own | Usuario estándar |
| **Guest** | read | Solo lectura |

**Nota**: El primer usuario registrado automáticamente se convierte en **Admin**.

## 🔐 Autenticación

### Ejemplo de Registro
```bash
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@templateapi.com",
    "password": "MiPassword123!",
    "firstName": "Admin",
    "lastName": "Principal"
  }'
```

### Ejemplo de Login
```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@templateapi.com",
    "password": "MiPassword123!"
  }'
```

## 🛠️ Desarrollo

### Estructura del Proyecto
```
src/
├── app.ts                     # Punto de entrada
├── config/                    # Configuración
├── controllers/               # Controladores
├── domain/                    # Lógica de dominio
│   ├── entities/             # Entidades
│   ├── repositories/         # Interfaces de repositorios
│   └── services/             # Servicios de dominio
├── infrastructure/           # Infraestructura
│   ├── database/            # Conexiones BD
│   ├── di/                  # Inyección de dependencias
│   └── repositories/        # Implementaciones
├── middlewares/             # Middlewares
├── routes/                  # Rutas
└── utils/                   # Utilidades
```

### Scripts Disponibles
```bash
npm run dev                    # Desarrollo con nodemon
npm run build                  # Compilar TypeScript
npm run start                  # Producción
npm run test                   # Tests (no implementado)
npm run generate:curl-guide    # Generar guía de cURL automáticamente
npm run docs:update            # Actualizar documentación
```

### 🤖 Automatización de Documentación

La guía de cURL se genera **automáticamente** analizando el código fuente:

```bash
# Generar/actualizar la guía de cURL
npm run generate:curl-guide
```

**¿Qué hace este script?**
- 🔍 **Escanea** todos los archivos de rutas en `src/routes/`
- 📊 **Detecta** 61+ endpoints automáticamente
- 🏷️ **Categoriza** por funcionalidad y nivel de acceso
- 📝 **Genera** comandos cURL completos con ejemplos
- 🎯 **Incluye** headers y JSON de ejemplo
- ⏰ **Actualiza** timestamp de generación

**Salida**: [`docs/CURL_GUIDE.md`](docs/CURL_GUIDE.md) con todos los endpoints

Ver [📖 Documentación de Scripts](scripts/README.md) para más detalles.

### Agregar Nuevo Endpoint
1. **Crear controlador** en `src/controllers/`
2. **Definir rutas** en `src/routes/`
3. **Registrar rutas** en `src/routes/index.ts`
4. **Actualizar documentación**

Ver [📋 Guía Fácil](docs/EASY_GUIDE.md) para detalles.

## 🔍 Búsqueda y Filtrado

### Características
- **Full-text search** con Elasticsearch (opcional)
- **Fallback** a Fuse.js para búsqueda en memoria
- **Filtros avanzados** con JSON dinámico
- **Sugerencias automáticas** de búsqueda
- **Facetas** para filtrado por categorías
- **Ordenamiento** por cualquier campo

### Configuración de Elasticsearch (Opcional)
```bash
# En tu archivo .env
ELASTICSEARCH_URL=http://localhost:9200
ELASTICSEARCH_AUTH=true
ELASTICSEARCH_USERNAME=elastic
ELASTICSEARCH_PASSWORD=changeme
```

### Ejemplos de Uso
```bash
# Búsqueda básica
curl "http://localhost:4000/search/content?query=javascript"

# Búsqueda con filtros
curl "http://localhost:4000/search/content?query=tutorial&filters={\"category\":\"programming\"}&sort=createdAt"

# Sugerencias
curl "http://localhost:4000/search/suggest?q=java&type=content"

# Obtener facetas
curl "http://localhost:4000/search/facets?index=content"
```

## 📚 Documentación Swagger

La API incluye documentación interactiva completa:

- **URL**: `http://localhost:4000/api-docs`
- **Características**:
  - Interfaz interactiva para probar endpoints
  - Esquemas de datos completos
  - Ejemplos de request/response
  - Autenticación JWT integrada
  - Documentación de errores

### Usar Swagger UI
1. Abre `http://localhost:4000/api-docs`
2. Expande cualquier endpoint para ver detalles
3. Usa "Try it out" para probar directamente
4. Para endpoints protegidos, haz clic en "Authorize" e ingresa tu JWT token

## 🧼 Sanitización Avanzada

### Protecciones Implementadas
- **XSS** (Cross-Site Scripting)
- **SQL Injection** y **NoSQL Injection**
- **Path Traversal** attacks
- **JavaScript Injection**
- **Null Byte** attacks
- **HTTP Parameter Pollution**
- **Payload size** limits

### Configuración por Contexto
```typescript
// Niveles de sanitización disponibles
STRICT     // Máxima seguridad, caracteres limitados
MODERATE   // Balance entre seguridad y funcionalidad
BASIC      // Sanitización básica
HTML_SAFE  // Permite HTML seguro con DOMPurify
```

## 📊 Monitoreo

### Health Checks
```bash
# API general
curl http://localhost:4000/health

# Base de datos
curl http://localhost:4000/db/health
```

### Estadísticas (Solo Admin)
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:4000/db/stats
```

## 🧪 Testing

### Con Postman
1. Importa `postman/template_api_collection.json`
2. Los tokens se guardan automáticamente
3. Prueba todos los endpoints organizados por categorías

### Con cURL
Ver [📖 Guía cURL](docs/CURL_GUIDE.md) para comandos completos.

## 🔧 Configuración Avanzada

### Variables de Entorno
```bash
# Servidor
PORT=4000
NODE_ENV=development

# Base de Datos
DATABASE_URL=mongodb://localhost:27017/templateapi

# Seguridad
JWT_SECRET=tu-secret-super-seguro-minimo-32-caracteres

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000

# CORS
CORS_ORIGIN=*
```

### Configuración de Producción
- ✅ Configurar `JWT_SECRET` seguro
- ✅ Usar HTTPS
- ✅ Configurar `CORS_ORIGIN` específico
- ✅ Usar base de datos persistente
- ✅ Configurar rate limiting estricto

## 🚨 Seguridad

- 🛡️ **Helmet** para headers de seguridad
- 🚦 **Rate Limiting** configurado
- 🔐 **JWT** con expiración
- 🧹 **Sanitización** de inputs
- 📝 **Logging** de seguridad
- 🔒 **Validación** de contraseñas

## 📈 Escalabilidad

- 🏗️ **Arquitectura Hexagonal**
- 💉 **Inyección de Dependencias**
- 🔄 **Pool de Conexiones**
- 📊 **Health Checks**
- 🧩 **Modular y extensible**

## 💡 Tips

- **Desarrollo rápido**: Usa repositorio en memoria
- **Testing**: Importa la colección de Postman
- **Producción**: Configura base de datos persistente
- **Debugging**: Revisa los logs detallados
- **Extensión**: Sigue la arquitectura hexagonal
