#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class CurlGuideGenerator {
  constructor() {
    this.endpoints = new Map();
    this.routeFiles = [];
    this.baseUrl = 'http://localhost:4000';
    this.outputFile = path.join(__dirname, '../docs/CURL_GUIDE.md');
  }

  /**
   * Punto de entrada principal
   */
  async generate() {
    console.log('🚀 Generando guía de curls automáticamente...');
    
    try {
      // 1. Buscar todos los archivos de rutas
      await this.findRouteFiles();
      
      // 2. Analizar cada archivo de rutas
      await this.analyzeRouteFiles();
      
      // 3. Generar la documentación
      await this.generateMarkdown();
      
      console.log('✅ Guía de curls generada exitosamente en:', this.outputFile);
      console.log(`📊 Total de endpoints encontrados: ${this.endpoints.size}`);
      
    } catch (error) {
      console.error('❌ Error generando la guía:', error.message);
      process.exit(1);
    }
  }

  /**
   * Busca todos los archivos de rutas en el proyecto
   */
  async findRouteFiles() {
    const routesDir = path.join(__dirname, '../src/routes');
    
    if (!fs.existsSync(routesDir)) {
      throw new Error('Directorio de rutas no encontrado: ' + routesDir);
    }

    const files = fs.readdirSync(routesDir);
    this.routeFiles = files
      .filter(file => file.endsWith('.ts') || file.endsWith('.js'))
      .map(file => path.join(routesDir, file));

    console.log(`📁 Encontrados ${this.routeFiles.length} archivos de rutas`);
  }

  /**
   * Analiza cada archivo de rutas para extraer endpoints
   */
  async analyzeRouteFiles() {
    for (const filePath of this.routeFiles) {
      console.log(`🔍 Analizando: ${path.basename(filePath)}`);
      await this.analyzeRouteFile(filePath);
    }
  }

  /**
   * Analiza un archivo de rutas específico
   */
  async analyzeRouteFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath, '.ts');
    
    // Extraer información básica del archivo
    const baseRoute = this.extractBaseRoute(fileName, content);
    
    // Buscar patrones de endpoints
    const routePatterns = [
      // router.get('/path', ...)
      /router\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g,
      // router.route('/path').get(...).post(...)
      /router\.route\s*\(\s*['"`]([^'"`]+)['"`]\s*\)[\s\S]*?\.(get|post|put|delete|patch)/g
    ];

    for (const pattern of routePatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const method = match[1] ? match[1].toUpperCase() : match[2].toUpperCase();
        const route = match[2] || match[1];
        
        if (route && method) {
          this.addEndpoint(baseRoute, route, method, filePath, content);
        }
      }
    }

    // Buscar comentarios de documentación
    this.extractDocumentation(content, baseRoute);
  }

  /**
   * Extrae la ruta base del archivo
   */
  extractBaseRoute(fileName, content) {
    // Mapeo de archivos a rutas base
    const routeMapping = {
      'index': '',
      'appRoutes': '',
      'authRoutes': '/auth',
      'userRoutes': '/users',
      'databaseAuthRoutes': '/db',
      'protectedRoutes': '/protected',
      'metricsRoutes': '/metrics',
      'jobRoutes': '/jobs',
      'versionRoutes': '/version',
      'enhancedUserRoutes': '/users'
    };

    // Intentar extraer de router.use en index.ts
    const useMatch = content.match(/router\.use\s*\(\s*['"`]([^'"`]*)['"`]\s*,\s*\w+Routes\s*\)/);
    if (useMatch) {
      return useMatch[1];
    }

    return routeMapping[fileName] || '';
  }

  /**
   * Añade un endpoint a la colección
   */
  addEndpoint(baseRoute, route, method, filePath, content) {
    const fullPath = baseRoute + route;
    const key = `${method} ${fullPath}`;
    
    if (!this.endpoints.has(key)) {
      // Extraer middlewares y permisos
      const middlewares = this.extractMiddlewares(content, route);
      const description = this.extractDescription(content, route);
      
      this.endpoints.set(key, {
        method,
        path: fullPath,
        baseRoute,
        route,
        file: path.basename(filePath),
        middlewares,
        description,
        requiresAuth: this.requiresAuth(middlewares),
        requiredRole: this.extractRequiredRole(middlewares),
        isPublic: this.isPublic(middlewares)
      });
    }
  }

  /**
   * Extrae middlewares de un endpoint
   */
  extractMiddlewares(content, route) {
    const middlewares = [];
    
    // Buscar líneas que contengan la ruta
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes(route)) {
        // Buscar middlewares en la línea actual y siguientes
        const middlewarePatterns = [
          'authenticateToken',
          'requireAuth',
          'requireAdmin',
          'requireAdminOrModerator',
          'requireAccess',
          'requirePermissions',
          'validateBody',
          'validateQuery',
          'validateParams',
          'optionalAuth'
        ];
        
        for (const middleware of middlewarePatterns) {
          if (line.includes(middleware)) {
            middlewares.push(middleware);
          }
        }
      }
    }
    
    return middlewares;
  }

  /**
   * Extrae descripción de comentarios
   */
  extractDescription(content, route) {
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes(route)) {
        // Buscar comentarios arriba de la ruta
        for (let j = i - 1; j >= Math.max(0, i - 5); j--) {
          const prevLine = lines[j].trim();
          if (prevLine.startsWith('*') || prevLine.startsWith('//')) {
            const descMatch = prevLine.match(/[@*\/]*\s*(.+)/);
            if (descMatch) {
              return descMatch[1].trim();
            }
          }
        }
      }
    }
    
    return '';
  }

  /**
   * Extrae documentación adicional
   */
  extractDocumentation(content, baseRoute) {
    // Buscar comentarios de documentación tipo JSDoc
    const docPattern = /\/\*\*[\s\S]*?\*\//g;
    let match;
    
    while ((match = docPattern.exec(content)) !== null) {
      const docBlock = match[0];
      // Procesar bloques de documentación si es necesario
    }
  }

  /**
   * Determina si un endpoint requiere autenticación
   */
  requiresAuth(middlewares) {
    const authMiddlewares = [
      'authenticateToken',
      'requireAuth',
      'requireAdmin',
      'requireAdminOrModerator',
      'requireAccess',
      'requirePermissions'
    ];
    
    return middlewares.some(m => authMiddlewares.includes(m));
  }

  /**
   * Extrae el rol requerido
   */
  extractRequiredRole(middlewares) {
    if (middlewares.includes('requireAdmin')) return 'admin';
    if (middlewares.includes('requireAdminOrModerator')) return 'admin/moderator';
    if (middlewares.includes('authenticateToken')) return 'authenticated';
    return 'public';
  }

  /**
   * Determina si un endpoint es público
   */
  isPublic(middlewares) {
    return !this.requiresAuth(middlewares) || middlewares.includes('optionalAuth');
  }

  /**
   * Genera el archivo Markdown
   */
  async generateMarkdown() {
    const markdown = this.buildMarkdown();
    
    // Crear directorio si no existe
    const dir = path.dirname(this.outputFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(this.outputFile, markdown, 'utf8');
  }

  /**
   * Construye el contenido Markdown
   */
  buildMarkdown() {
    const now = new Date().toISOString();
    
    let markdown = `# 🌐 Guía Completa de cURL - Template API

Esta guía contiene **TODOS** los comandos curl para interactuar con la Template API, incluyendo todas las funcionalidades avanzadas y todos los endpoints disponibles.

> 🤖 **Generado automáticamente** el ${now}
> 
> Para actualizar esta guía, ejecuta: \`npm run generate:curl-guide\`

## 📋 Requisitos Previos

1. **Servidor corriendo**: \`npm run dev\`
2. **Base URL**: \`http://localhost:4000\` (o tu configuración)
3. **Content-Type**: Siempre usar \`application/json\` para POST/PUT
4. **Token**: Necesario para endpoints protegidos
5. **jq**: Recomendado para formatear respuestas JSON (\`brew install jq\`)

## 🚀 Quick Setup

### 1. Variables de entorno
\`\`\`bash
export BASE_URL="http://localhost:4000"
export TOKEN=""  # Se llenará después del login
\`\`\`

---

`;

    // Agrupar endpoints por categoría
    const categories = this.categorizeEndpoints();
    
    for (const [category, endpoints] of categories) {
      markdown += this.buildCategorySection(category, endpoints);
    }

    // Añadir secciones adicionales
    markdown += this.buildAdditionalSections(now);

    return markdown;
  }

  /**
   * Categoriza los endpoints
   */
  categorizeEndpoints() {
    const categories = new Map();
    
    for (const [key, endpoint] of this.endpoints) {
      let category;
      
      if (endpoint.isPublic) {
        category = '🌍 ENDPOINTS PÚBLICOS';
      } else if (endpoint.path.startsWith('/auth')) {
        category = '🔐 AUTENTICACIÓN';
      } else if (endpoint.path.startsWith('/db')) {
        category = '🗄️ BASE DE DATOS';
      } else if (endpoint.path.startsWith('/users')) {
        category = '👥 GESTIÓN DE USUARIOS';
      } else if (endpoint.path.startsWith('/metrics')) {
        category = '📊 PERFORMANCE MONITORING';
      } else if (endpoint.path.startsWith('/jobs')) {
        category = '📋 BACKGROUND JOBS';
      } else if (endpoint.path.startsWith('/protected')) {
        category = '🔒 RUTAS PROTEGIDAS';
      } else {
        category = '🔧 OTROS ENDPOINTS';
      }
      
      if (!categories.has(category)) {
        categories.set(category, []);
      }
      
      categories.get(category).push(endpoint);
    }
    
    // Ordenar endpoints dentro de cada categoría
    for (const [category, endpoints] of categories) {
      endpoints.sort((a, b) => {
        // Ordenar por método primero, luego por path
        if (a.method !== b.method) {
          const methodOrder = { 'GET': 1, 'POST': 2, 'PUT': 3, 'DELETE': 4, 'PATCH': 5 };
          return (methodOrder[a.method] || 99) - (methodOrder[b.method] || 99);
        }
        return a.path.localeCompare(b.path);
      });
    }
    
    return categories;
  }

  /**
   * Construye una sección de categoría
   */
  buildCategorySection(category, endpoints) {
    let section = `## ${category}\n\n`;
    
    for (const endpoint of endpoints) {
      section += this.buildEndpointCurl(endpoint);
      section += '\n';
    }
    
    section += '---\n\n';
    return section;
  }

  /**
   * Construye el curl para un endpoint específico
   */
  buildEndpointCurl(endpoint) {
    const { method, path, description, requiresAuth, requiredRole } = endpoint;
    
    let curl = `### ${method} ${path}\n`;
    
    if (description) {
      curl += `${description}\n`;
    }
    
    if (requiredRole !== 'public') {
      curl += `**Requiere**: ${requiredRole}\n`;
    }
    
    curl += '```bash\n';
    curl += `curl -X ${method} {{BASE_URL}}${path}`;
    
    // Añadir headers comunes
    if (requiresAuth) {
      curl += ' \\\\\n  -H "Authorization: Bearer {{token}}"';
    }
    
    if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
      curl += ' \\\\\n  -H "Content-Type: application/json"';
    }
    
    // Añadir body de ejemplo para métodos que lo requieren
    if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
      const exampleBody = this.generateExampleBody(path);
      if (exampleBody) {
        curl += ` \\\\\n  -d '${exampleBody}'`;
      }
    }
    
    curl += '\n```\n\n';
    
    return curl;
  }

  /**
   * Genera un body de ejemplo basado en el path
   */
  generateExampleBody(path) {
    const examples = {
      '/auth/register': JSON.stringify({
        email: "user@example.com",
        password: "Password123!",
        firstName: "Nombre",
        lastName: "Apellido"
      }, null, 2),
      '/auth/login': JSON.stringify({
        email: "user@example.com",
        password: "Password123!"
      }, null, 2),
      '/auth/change-password': JSON.stringify({
        currentPassword: "Password123!",
        newPassword: "NewPassword456!"
      }, null, 2),
      '/users': JSON.stringify({
        email: "newuser@example.com",
        password: "Password123!",
        firstName: "Nuevo",
        lastName: "Usuario",
        role: "user"
      }, null, 2)
    };
    
    // Buscar coincidencia exacta o parcial
    for (const [examplePath, body] of Object.entries(examples)) {
      if (path === examplePath || path.includes(examplePath)) {
        return body;
      }
    }
    
    return null;
  }

  /**
   * Construye secciones adicionales
   */
  buildAdditionalSections(now) {
    return `
## 📊 RESUMEN DE ENDPOINTS

### Por Categoría
${this.buildEndpointSummary()}

### Por Nivel de Acceso
${this.buildAccessSummary()}

---

## 💡 Tips y Trucos

### 1. Formatear respuestas JSON
\`\`\`bash
curl -s {{BASE_URL}}/health | jq '.'
\`\`\`

### 2. Guardar respuestas en archivo
\`\`\`bash
curl -s {{BASE_URL}}/auth/me -H "Authorization: Bearer {{token}}" > user_info.json
\`\`\`

### 3. Mostrar headers de respuesta
\`\`\`bash
curl -i -X GET {{BASE_URL}}/health
\`\`\`

### 4. Modo verbose para debugging
\`\`\`bash
curl -v -X POST {{BASE_URL}}/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"user@example.com","password":"Password123!"}'
\`\`\`

---

## 🔍 Troubleshooting

### Error: Connection refused
\`\`\`bash
# Verificar que el servidor esté corriendo
curl -I http://localhost:4000
# Si falla, ejecutar: npm run dev
\`\`\`

### Error: 401 Unauthorized
\`\`\`bash
# Verificar que el token sea válido
echo $TOKEN
# Si está vacío o expirado, hacer login nuevamente
\`\`\`

---

## 🤖 Generación Automática

Esta guía se genera automáticamente analizando el código fuente. Para actualizarla:

\`\`\`bash
npm run generate:curl-guide
\`\`\`

El script analiza los siguientes archivos:
${this.routeFiles.map(f => `- \`${path.basename(f)}\``).join('\n')}

---

> 📅 **Última actualización**: ${now}
> 
> 🔄 **Total de endpoints**: ${this.endpoints.size}
`;
  }

  /**
   * Construye resumen de endpoints por categoría
   */
  buildEndpointSummary() {
    const categories = this.categorizeEndpoints();
    let summary = '';
    
    for (const [category, endpoints] of categories) {
      const cleanCategory = category.replace(/🌍|🔐|🗄️|👥|📊|📋|🔒|🔧/, '').trim();
      summary += `- **${cleanCategory}**: ${endpoints.length} endpoints\n`;
    }
    
    return summary;
  }

  /**
   * Construye resumen por nivel de acceso
   */
  buildAccessSummary() {
    const accessLevels = new Map();
    
    for (const [key, endpoint] of this.endpoints) {
      const level = endpoint.requiredRole;
      if (!accessLevels.has(level)) {
        accessLevels.set(level, 0);
      }
      accessLevels.set(level, accessLevels.get(level) + 1);
    }
    
    let summary = '';
    for (const [level, count] of accessLevels) {
      summary += `- **${level}**: ${count} endpoints\n`;
    }
    
    return summary;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const generator = new CurlGuideGenerator();
  generator.generate().catch(console.error);
}

module.exports = CurlGuideGenerator;
