# 🤖 Scripts de Automatización

Este directorio contiene scripts para automatizar tareas comunes del proyecto.

## 📋 Scripts Disponibles

### `generate-curl-guide.js`

Genera automáticamente la guía completa de cURL analizando todos los archivos de rutas del proyecto.

#### 🚀 Uso

```bash
# Ejecutar el script directamente
npm run generate:curl-guide

# O directamente con node
node scripts/generate-curl-guide.js

# También se puede usar el alias
npm run docs:update
```

#### 🔍 ¿Qué hace?

1. **Escanea** todos los archivos de rutas en `src/routes/`
2. **Analiza** cada archivo para extraer:
   - Métodos HTTP (GET, POST, PUT, DELETE, PATCH)
   - Rutas y parámetros
   - Middlewares de autenticación
   - Comentarios de documentación
   - Permisos requeridos
3. **Categoriza** los endpoints por:
   - Nivel de acceso (público, autenticado, admin, etc.)
   - Funcionalidad (autenticación, usuarios, métricas, etc.)
4. **Genera** un archivo Markdown con:
   - Comandos cURL completos
   - Ejemplos de JSON para POST/PUT
   - Headers necesarios
   - Documentación detallada

#### 📊 Salida

- **Archivo generado**: `docs/CURL_GUIDE.md`
- **Total de endpoints**: ~61 endpoints detectados
- **Categorías**: 8 categorías diferentes
- **Formato**: Markdown con sintaxis highlighting

#### 🎯 Características

- ✅ **Detección automática** de endpoints
- ✅ **Extracción de middlewares** (auth, validación, etc.)
- ✅ **Ejemplos de JSON** para cada endpoint
- ✅ **Categorización inteligente** por funcionalidad
- ✅ **Headers automáticos** según el tipo de endpoint
- ✅ **Documentación de comentarios** del código
- ✅ **Timestamp de generación** para tracking
- ✅ **Resumen estadístico** de endpoints

#### 🔧 Configuración

El script se puede personalizar modificando:

```javascript
// En generate-curl-guide.js
class CurlGuideGenerator {
  constructor() {
    this.baseUrl = 'http://localhost:4000';  // URL base
    this.outputFile = 'docs/CURL_GUIDE.md';  // Archivo de salida
  }
}
```

#### 📁 Archivos Analizados

El script analiza automáticamente estos archivos:

- `appRoutes.ts` - Rutas básicas de la aplicación
- `authRoutes.ts` - Autenticación y autorización
- `userRoutes.ts` - Gestión de usuarios
- `databaseAuthRoutes.ts` - Auth con inyección de dependencias
- `protectedRoutes.ts` - Rutas con control avanzado de acceso
- `metricsRoutes.ts` - Monitoreo de performance
- `jobRoutes.ts` - Trabajos en background
- `versionRoutes.ts` - Información de versiones
- `enhancedUserRoutes.ts` - Rutas avanzadas de usuarios
- `index.ts` - Configuración de rutas

#### 🎨 Ejemplo de Salida

```markdown
### POST /auth/login
**Requiere**: public
```bash
curl -X POST {{BASE_URL}}/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{
  "email": "user@example.com",
  "password": "Password123!"
}'
```

### GET /users
**Requiere**: admin/moderator
```bash
curl -X GET {{BASE_URL}}/users \\
  -H "Authorization: Bearer {{token}}"
```

#### 🚨 Limitaciones Actuales

- **Patrones de rutas**: Solo detecta patrones básicos de Express Router
- **Comentarios**: Extrae comentarios simples, no JSDoc completo
- **Ejemplos JSON**: Los ejemplos son estáticos, no generados dinámicamente
- **Middlewares**: Detección basada en nombres de funciones conocidas

#### 🔮 Mejoras Futuras

- [ ] **Análisis de DTOs** para generar ejemplos JSON más precisos
- [ ] **Extracción de JSDoc** completa
- [ ] **Validación de endpoints** ejecutando requests de prueba
- [ ] **Generación de Postman Collections**
- [ ] **Integración con OpenAPI/Swagger**
- [ ] **Detección automática de nuevas rutas**
- [ ] **Generación de tests automatizados**

## 🛠️ Añadir Nuevos Scripts

Para añadir un nuevo script:

1. **Crear** el archivo en `scripts/`
2. **Hacer ejecutable**: `chmod +x scripts/tu-script.js`
3. **Añadir al package.json**:
   ```json
   {
     "scripts": {
       "tu-comando": "node scripts/tu-script.js"
     }
   }
   ```

## 📝 Ejemplo de Nuevo Script

```javascript
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class TuScript {
  constructor() {
    // Configuración
  }

  async execute() {
    try {
      console.log('🚀 Ejecutando tu script...');
      // Tu lógica aquí
      console.log('✅ Script completado');
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const script = new TuScript();
  script.execute().catch(console.error);
}

module.exports = TuScript;
```

---

## 📊 Scripts en package.json

Actualmente disponibles:

```json
{
  "scripts": {
    "generate:curl-guide": "node scripts/generate-curl-guide.js",
    "docs:update": "npm run generate:curl-guide",
    "postinstall": "npm run generate:curl-guide"
  }
}
```

- **`generate:curl-guide`**: Genera la guía de cURL
- **`docs:update`**: Alias para actualizar documentación
- **`postinstall`**: Se ejecuta automáticamente después de `npm install`
