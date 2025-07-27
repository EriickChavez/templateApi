# 🛡️ Características Avanzadas: Seguridad y Búsqueda

Esta documentación cubre las características avanzadas implementadas en la Template API:
- 🧼 Sanitización Avanzada de Inputs
- 🔍 Sistema de Búsqueda y Filtrado
- 📚 Documentación Swagger/OpenAPI

## 🧼 Sanitización Avanzada de Inputs

### Descripción General
El sistema de sanitización protege contra múltiples tipos de ataques mediante capas de validación y limpieza de datos.

### Protecciones Implementadas

#### 1. Cross-Site Scripting (XSS)
```typescript
// Protección contra scripts maliciosos
<script>alert('xss')</script> → [ELIMINADO]
onclick="alert('xss')" → [ELIMINADO]
javascript:alert('xss') → [ELIMINADO]
```

#### 2. SQL/NoSQL Injection
```typescript
// SQL Injection
"SELECT * FROM users" → [ELIMINADO]
"DROP TABLE users" → [ELIMINADO]

// NoSQL Injection
{"$where": "malicious code"} → [ELIMINADO]
{"$ne": null} → [ELIMINADO]
```

#### 3. Path Traversal
```typescript
// Intentos de acceso a archivos del sistema
"../../../etc/passwd" → [ELIMINADO]
"..\\windows\\system32" → [ELIMINADO]
```

#### 4. Command Injection
```typescript
// Comandos del sistema
"ls -la; rm -rf /" → [ELIMINADO]
"`rm -rf /`" → [ELIMINADO]
```

### Niveles de Sanitización

#### STRICT
- **Uso**: Campos críticos (nombres, IDs)
- **Características**:
  - Longitud máxima: 255 caracteres
  - Solo caracteres alfanuméricos y básicos
  - Normalización Unicode
  - Escape HTML automático

#### MODERATE
- **Uso**: Contenido general (descripciones, comentarios)
- **Características**:
  - Longitud máxima: 1000 caracteres
  - Permite caracteres especiales seguros
  - Bloquea patrones peligrosos

#### BASIC
- **Uso**: Contenido extenso
- **Características**:
  - Longitud máxima: 5000 caracteres
  - Sanitización básica
  - Preserva formato

#### HTML_SAFE
- **Uso**: Contenido rico (editores WYSIWYG)
- **Características**:
  - Permite HTML seguro
  - DOMPurify integration
  - Whitelist de tags permitidos

### Sanitizadores Específicos

```typescript
// Sanitizadores por tipo de campo
fieldSanitizers = {
  email: (value) => sanitizeEmail(value),
  password: (value) => sanitizeString(value, BASIC, { maxLength: 128 }),
  name: (value) => sanitizeString(value, STRICT, { maxLength: 50 }),
  phone: (value) => sanitizePhone(value),
  url: (value) => sanitizeURL(value),
  searchQuery: (value) => sanitizeSearchQuery(value)
}
```

### Configuración por Endpoint

```typescript
// Ejemplos de configuración automática
export const sanitizationPresets = {
  auth: routeSpecificSanitization({
    body: {
      email: 'email',
      password: 'password',
      firstName: 'name',
      lastName: 'name'
    }
  }),
  
  search: routeSpecificSanitization({
    query: {
      q: 'searchQuery',
      category: 'slug',
      page: (value) => sanitizeNumber(value, { min: 1, integer: true }),
      limit: (value) => sanitizeNumber(value, { min: 1, max: 100, integer: true })
    }
  })
}
```

## 🔍 Sistema de Búsqueda y Filtrado

### Arquitectura Dual

#### Elasticsearch (Producción)
- **Full-text search** potente
- **Índices optimizados** para rendimiento
- **Agregaciones** para facetas
- **Scaling horizontal**

#### Fuse.js (Desarrollo/Fallback)
- **Búsqueda en memoria** sin dependencias
- **Fuzzy search** inteligente
- **Configuración flexible**
- **Fallback automático**

### Características Principales

#### 1. Full-Text Search
```bash
# Búsqueda básica
GET /search/content?query=javascript

# Búsqueda con pesos (title tiene prioridad)
# Internamente: title^2, content, tags
```

#### 2. Filtros Dinámicos
```bash
# Filtros JSON flexibles
GET /search/content?query=tutorial&filters={"category":"programming","isPublished":true}

# Múltiples filtros
GET /search/users?query=juan&filters={"role":"User","status":"ACTIVE"}
```

#### 3. Ordenamiento
```bash
# Ordenar por fecha
GET /search/content?query=react&sort=createdAt

# Orden descendente (configurable)
GET /search/content?query=react&sort=updatedAt&order=desc
```

#### 4. Sugerencias Automáticas
```bash
# Autocompletado inteligente
GET /search/suggest?q=java&type=content
# Respuesta: ["javascript", "java tutorial", "java framework"]
```

#### 5. Facetas para Filtrado
```bash
# Obtener categorías disponibles
GET /search/facets?index=content
# Respuesta: 
{
  "categories": [
    {"value": "programming", "count": 150},
    {"value": "design", "count": 89}
  ],
  "tags": [
    {"value": "javascript", "count": 120},
    {"value": "react", "count": 95}
  ]
}
```

### Configuración de Elasticsearch

#### Instalación Local
```bash
# Docker (recomendado)
docker run -d \
  --name elasticsearch \
  -p 9200:9200 \
  -e "discovery.type=single-node" \
  -e "ES_JAVA_OPTS=-Xms512m -Xmx512m" \
  elasticsearch:8.11.0
```

#### Variables de Entorno
```bash
# Configuración básica
ELASTICSEARCH_URL=http://localhost:9200

# Con autenticación
ELASTICSEARCH_AUTH=true
ELASTICSEARCH_USERNAME=elastic
ELASTICSEARCH_PASSWORD=changeme

# SSL (producción)
ELASTICSEARCH_SSL=true
```

#### Índices Automáticos
La API crea automáticamente estos índices:

```typescript
// Índice de usuarios
{
  "users": {
    "mappings": {
      "properties": {
        "id": { "type": "keyword" },
        "email": { "type": "text", "analyzer": "standard" },
        "fullName": { "type": "text", "analyzer": "standard" },
        "role": { "type": "keyword" },
        "createdAt": { "type": "date" }
      }
    }
  }
}

// Índice de contenido
{
  "content": {
    "mappings": {
      "properties": {
        "title": { "type": "text", "analyzer": "standard" },
        "content": { "type": "text", "analyzer": "standard" },
        "tags": { "type": "keyword" },
        "category": { "type": "keyword" }
      }
    }
  }
}
```

### Integración en Código

#### Usar en Controladores
```typescript
import { searchWithElasticsearch, searchWithFuse } from '../services/searchService';
import { isElasticsearchConnected } from '../config/elasticsearch';

export class MyController {
  async search(req: Request, res: Response) {
    const { query, filters, sort } = req.query;
    
    let results = [];
    
    if (isElasticsearchConnected()) {
      // Usar Elasticsearch
      results = await searchWithElasticsearch('myindex', query, filters, sort);
    } else {
      // Fallback a Fuse.js
      const dataSet = await this.getDataFromDatabase();
      results = searchWithFuse(dataSet, query, filters, sort);
    }
    
    res.json({ success: true, data: results });
  }
}
```

#### Indexar Datos en Elasticsearch
```typescript
// Ejemplo de indexación manual
const esClient = getElasticsearchClient();

if (esClient) {
  await esClient.index({
    index: 'content',
    id: article.id,
    body: {
      title: article.title,
      content: article.content,
      tags: article.tags,
      category: article.category,
      createdAt: article.createdAt
    }
  });
}
```

## 📚 Documentación Swagger/OpenAPI

### Características Implementadas

#### 1. Documentación Completa
- **Esquemas de datos** con validaciones
- **Ejemplos de request/response**
- **Códigos de error** documentados
- **Autenticación JWT** integrada

#### 2. Interfaz Interactiva
- **Try it out** para probar endpoints
- **Authorize** para JWT tokens
- **Respuestas en tiempo real**
- **Validación automática**

#### 3. Organización por Tags
```yaml
tags:
  - name: "Autenticación"
    description: "Endpoints de login, registro y gestión de sesiones"
  - name: "Búsqueda" 
    description: "Sistema de búsqueda y filtrado"
  - name: "Usuarios"
    description: "Gestión de usuarios y perfiles"
```

### Configuración Avanzada

#### Información de la API
```typescript
const swaggerConfig = {
  openapi: '3.0.0',
  info: {
    title: 'Template API',
    version: '1.0.0',
    description: 'API completa con autenticación JWT y búsqueda avanzada',
    contact: {
      name: 'API Support',
      email: 'support@templateapi.com'
    }
  },
  servers: [
    { url: 'http://localhost:4000', description: 'Desarrollo' },
    { url: 'https://api.templateapi.com', description: 'Producción' }
  ]
}
```

#### Esquemas Reutilizables
```yaml
components:
  schemas:
    User:
      type: object
      required: [id, email, role]
      properties:
        id: { type: string }
        email: { type: string, format: email }
        role: { type: string, enum: [Admin, User, Moderator, Guest] }
    
    ErrorResponse:
      type: object
      properties:
        success: { type: boolean, example: false }
        message: { type: string }
        error: { type: string }
        timestamp: { type: string, format: date-time }
```

#### Documentar Endpoints
```typescript
/**
 * @swagger
 * /search/content:
 *   get:
 *     summary: Búsqueda de contenido con full-text search
 *     tags: [Búsqueda]
 *     parameters:
 *       - name: query
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *           example: "javascript tutorial"
 *     responses:
 *       200:
 *         description: Resultados de búsqueda
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: array }
 */
router.get('/content', searchController.searchContent);
```

### Uso de Swagger UI

#### Acceso
1. Inicia la API: `npm run dev`
2. Abre: `http://localhost:4000/api-docs`
3. Explora la documentación interactiva

#### Autenticación
1. Haz login en `/auth/login` para obtener token
2. Clic en "Authorize" en Swagger UI
3. Ingresa: `Bearer <tu-jwt-token>`
4. Prueba endpoints protegidos

#### Testing Directo
1. Expande cualquier endpoint
2. Clic en "Try it out"
3. Llena los parámetros requeridos
4. Clic en "Execute"
5. Ve la respuesta en tiempo real

## 🚀 Mejores Prácticas

### Sanitización
- **Siempre** sanitizar inputs del usuario
- **Usar** niveles apropiados según el contexto
- **Validar** después de sanitizar
- **Registrar** intentos de ataques

### Búsqueda
- **Implementar** paginación en resultados grandes
- **Usar** índices apropiados en Elasticsearch
- **Configurar** límites de rate limiting para búsquedas
- **Monitorear** performance de queries

### Documentación
- **Mantener** Swagger actualizado con cambios
- **Incluir** ejemplos realistas
- **Documentar** todos los códigos de error
- **Usar** esquemas reutilizables

## 🔧 Troubleshooting

### Problemas Comunes

#### Elasticsearch no conecta
```bash
# Verificar que Elasticsearch esté corriendo
curl http://localhost:9200/_health

# Revisar logs de la API
# La API debe mostrar: "usando búsqueda en memoria"
```

#### Sanitización muy estricta
```typescript
// Ajustar nivel de sanitización
app.use('/api/content', routeSpecificSanitization({
  body: {
    content: 'htmlContent' // Permite HTML seguro
  }
}));
```

#### Swagger no carga
```bash
# Verificar que el servidor esté corriendo en el puerto correcto
# Acceder a: http://localhost:4000/api-docs
# Revisar consola del navegador para errores
```

---

Esta documentación cubre las implementaciones avanzadas de seguridad y búsqueda. Para más detalles, consulta el código fuente y los ejemplos en los controladores.
