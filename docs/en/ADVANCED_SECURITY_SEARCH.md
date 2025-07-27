# 🛡️ Advanced Features: Security and Search

This documentation covers the advanced features implemented in the Template API:
- 🧼 Advanced Input Sanitization
- 🔍 Search and Filtering System
- 📚 Swagger/OpenAPI Documentation

## 🧼 Advanced Input Sanitization

### Overview
The sanitization system protects against multiple types of attacks through validation and data cleaning layers.

### Implemented Protections

#### 1. Cross-Site Scripting (XSS)
```typescript
// Protection against malicious scripts
<script>alert('xss')</script> → [REMOVED]
onclick="alert('xss')" → [REMOVED]
javascript:alert('xss') → [REMOVED]
```

#### 2. SQL/NoSQL Injection
```typescript
// SQL Injection
"SELECT * FROM users" → [REMOVED]
"DROP TABLE users" → [REMOVED]

// NoSQL Injection
{"$where": "malicious code"} → [REMOVED]
{"$ne": null} → [REMOVED]
```

#### 3. Path Traversal
```typescript
// System file access attempts
"../../../etc/passwd" → [REMOVED]
"..\\windows\\system32" → [REMOVED]
```

#### 4. Command Injection
```typescript
// System commands
"ls -la; rm -rf /" → [REMOVED]
"`rm -rf /`" → [REMOVED]
```

### Sanitization Levels

#### STRICT
- **Usage**: Critical fields (names, IDs)
- **Features**:
  - Maximum length: 255 characters
  - Only alphanumeric and basic characters
  - Unicode normalization
  - Automatic HTML escaping

#### MODERATE
- **Usage**: General content (descriptions, comments)
- **Features**:
  - Maximum length: 1000 characters
  - Allows safe special characters
  - Blocks dangerous patterns

#### BASIC
- **Usage**: Extensive content
- **Features**:
  - Maximum length: 5000 characters
  - Basic sanitization
  - Preserves formatting

#### HTML_SAFE
- **Usage**: Rich content (WYSIWYG editors)
- **Features**:
  - Allows safe HTML
  - DOMPurify integration
  - Whitelist of allowed tags

### Specific Sanitizers

```typescript
// Field-specific sanitizers
fieldSanitizers = {
  email: (value) => sanitizeEmail(value),
  password: (value) => sanitizeString(value, BASIC, { maxLength: 128 }),
  name: (value) => sanitizeString(value, STRICT, { maxLength: 50 }),
  phone: (value) => sanitizePhone(value),
  url: (value) => sanitizeURL(value),
  searchQuery: (value) => sanitizeSearchQuery(value)
}
```

### Endpoint Configuration

```typescript
// Automatic configuration examples
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

## 🔍 Search and Filtering System

### Dual Architecture

#### Elasticsearch (Production)
- **Powerful full-text search**
- **Optimized indices** for performance
- **Aggregations** for facets
- **Horizontal scaling**

#### Fuse.js (Development/Fallback)
- **In-memory search** without dependencies
- **Intelligent fuzzy search**
- **Flexible configuration**
- **Automatic fallback**

### Main Features

#### 1. Full-Text Search
```bash
# Basic search
GET /search/content?query=javascript

# Weighted search (title has priority)
# Internally: title^2, content, tags
```

#### 2. Dynamic Filters
```bash
# Flexible JSON filters
GET /search/content?query=tutorial&filters={"category":"programming","isPublished":true}

# Multiple filters
GET /search/users?query=juan&filters={"role":"User","status":"ACTIVE"}
```

#### 3. Sorting
```bash
# Sort by date
GET /search/content?query=react&sort=createdAt

# Descending order (configurable)
GET /search/content?query=react&sort=updatedAt&order=desc
```

#### 4. Auto-suggestions
```bash
# Intelligent autocomplete
GET /search/suggest?q=java&type=content
# Response: ["javascript", "java tutorial", "java framework"]
```

#### 5. Facets for Filtering
```bash
# Get available categories
GET /search/facets?index=content
# Response: 
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

### Elasticsearch Configuration

#### Local Installation
```bash
# Docker (recommended)
docker run -d \
  --name elasticsearch \
  -p 9200:9200 \
  -e "discovery.type=single-node" \
  -e "ES_JAVA_OPTS=-Xms512m -Xmx512m" \
  elasticsearch:8.11.0
```

#### Environment Variables
```bash
# Basic configuration
ELASTICSEARCH_URL=http://localhost:9200

# With authentication
ELASTICSEARCH_AUTH=true
ELASTICSEARCH_USERNAME=elastic
ELASTICSEARCH_PASSWORD=changeme

# SSL (production)
ELASTICSEARCH_SSL=true
```

#### Automatic Indices
The API automatically creates these indices:

```typescript
// Users index
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

// Content index
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

### Code Integration

#### Use in Controllers
```typescript
import { searchWithElasticsearch, searchWithFuse } from '../services/searchService';
import { isElasticsearchConnected } from '../config/elasticsearch';

export class MyController {
  async search(req: Request, res: Response) {
    const { query, filters, sort } = req.query;
    
    let results = [];
    
    if (isElasticsearchConnected()) {
      // Use Elasticsearch
      results = await searchWithElasticsearch('myindex', query, filters, sort);
    } else {
      // Fallback to Fuse.js
      const dataSet = await this.getDataFromDatabase();
      results = searchWithFuse(dataSet, query, filters, sort);
    }
    
    res.json({ success: true, data: results });
  }
}
```

#### Index Data in Elasticsearch
```typescript
// Manual indexing example
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

## 📚 Swagger/OpenAPI Documentation

### Implemented Features

#### 1. Complete Documentation
- **Data schemas** with validations
- **Request/response examples**
- **Documented error codes**
- **Integrated JWT authentication**

#### 2. Interactive Interface
- **Try it out** to test endpoints
- **Authorize** for JWT tokens
- **Real-time responses**
- **Automatic validation**

#### 3. Organization by Tags
```yaml
tags:
  - name: "Authentication"
    description: "Login, registration and session management endpoints"
  - name: "Search" 
    description: "Search and filtering system"
  - name: "Users"
    description: "User and profile management"
```

### Advanced Configuration

#### API Information
```typescript
const swaggerConfig = {
  openapi: '3.0.0',
  info: {
    title: 'Template API',
    version: '1.0.0',
    description: 'Complete API with JWT authentication and advanced search',
    contact: {
      name: 'API Support',
      email: 'support@templateapi.com'
    }
  },
  servers: [
    { url: 'http://localhost:4000', description: 'Development' },
    { url: 'https://api.templateapi.com', description: 'Production' }
  ]
}
```

#### Reusable Schemas
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

#### Document Endpoints
```typescript
/**
 * @swagger
 * /search/content:
 *   get:
 *     summary: Content search with full-text search
 *     tags: [Search]
 *     parameters:
 *       - name: query
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *           example: "javascript tutorial"
 *     responses:
 *       200:
 *         description: Search results
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

### Using Swagger UI

#### Access
1. Start the API: `npm run dev`
2. Open: `http://localhost:4000/api-docs`
3. Explore the interactive documentation

#### Authentication
1. Login at `/auth/login` to get token
2. Click "Authorize" in Swagger UI
3. Enter: `Bearer <your-jwt-token>`
4. Test protected endpoints

#### Direct Testing
1. Expand any endpoint
2. Click "Try it out"
3. Fill required parameters
4. Click "Execute"
5. See real-time response

## 🚀 Best Practices

### Sanitization
- **Always** sanitize user inputs
- **Use** appropriate levels based on context
- **Validate** after sanitizing
- **Log** attack attempts

### Search
- **Implement** pagination for large results
- **Use** appropriate indices in Elasticsearch
- **Configure** rate limiting for searches
- **Monitor** query performance

### Documentation
- **Keep** Swagger updated with changes
- **Include** realistic examples
- **Document** all error codes
- **Use** reusable schemas

## 🔧 Troubleshooting

### Common Issues

#### Elasticsearch not connecting
```bash
# Verify Elasticsearch is running
curl http://localhost:9200/_health

# Check API logs
# API should show: "using in-memory search"
```

#### Sanitization too strict
```typescript
// Adjust sanitization level
app.use('/api/content', routeSpecificSanitization({
  body: {
    content: 'htmlContent' // Allows safe HTML
  }
}));
```

#### Swagger not loading
```bash
# Verify server is running on correct port
# Access: http://localhost:4000/api-docs
# Check browser console for errors
```

---

This documentation covers the advanced implementations of security and search. For more details, check the source code and examples in the controllers.
