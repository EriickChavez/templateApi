# Problemas de Sanitización y Soluciones

## Error: "Cannot set property query of #<IncomingMessage> which has only a getter"

### Descripción del Problema

Este error ocurre cuando middlewares de sanitización intentan modificar la propiedad `req.query` del objeto `Request` de Express. En Express 5.x, algunos middlewares como `express-mongo-sanitize` y `hpp` pueden hacer que `req.query` sea inmutable (solo lectura).

### Causa Raíz

El problema surge de la combinación de varios factores:

1. **Express 5.x** - Cambios en el manejo de query parameters
2. **Middleware hpp** - HTTP Parameter Pollution protection que modifica `req.query`
3. **express-mongo-sanitize** - Intenta modificar `req.query` directamente
4. **Orden de middlewares** - El orden en que se aplican puede causar conflictos

### Solución Implementada

#### 1. Enfoque de Validación vs Modificación

En lugar de modificar `req.query`, ahora validamos los query parameters:

```typescript
// ❌ ANTES (causaba el error)
req.query = sanitizeObject(req.query, SANITIZATION_LEVELS.BASIC);

// ✅ AHORA (solo validación)
const validateQuery = (obj: any, path: string = 'query'): void => {
  if (typeof obj === 'string') {
    const dangerousPatterns = [
      /<script/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /on\w+\s*=/gi,
      /(\$where|\$ne|\$gt|\$lt|\$gte|\$lte|\$in|\$nin|\$regex|\$exists|\$type)/gi
    ];
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(obj)) {
        throw new Error(`Patrón peligroso detectado en query parameter: ${path}`);
      }
    }
  }
  // ... resto de validaciones
};
```

#### 2. Middlewares Problemáticos Deshabilitados

Por el momento, hemos deshabilitado temporalmente:

- `mongoSanitization` - Causa conflictos con `req.query`
- `hppProtection` - HTTP Parameter Pollution protection

```typescript
export const fullSanitizationSuite = [
  sizeProtection(),
  nullByteProtection,
  pathTraversalProtection,
  jsInjectionProtection,
  // mongoSanitization, // Temporalmente deshabilitado
  generalSanitization
  // HPP removido temporalmente
];
```

#### 3. Sanitización Específica por Ruta

Para rutas que necesitan query parameter sanitization específica, usamos validación en lugar de modificación:

```typescript
// Solo valida, no modifica req.query
if (sanitizationRules.query && req.query) {
  for (const [field, sanitizer] of Object.entries(sanitizationRules.query)) {
    if (req.query[field] !== undefined) {
      const value = req.query[field] as string;
      // Validar patrones peligrosos
      // Lanzar error si se encuentra algo peligroso
    }
  }
}
```

### Medidas de Seguridad Mantenidas

A pesar de los cambios, la seguridad se mantiene mediante:

1. **Validación de patrones peligrosos** - Script injection, NoSQL injection, etc.
2. **Sanitización de body y params** - Continúa funcionando normalmente
3. **Protección null bytes** - Detecta caracteres null peligrosos
4. **Protección path traversal** - Previene ataques de directorio
5. **Protección JavaScript injection** - Detecta intentos de inyección de código
6. **Protección de tamaño** - Limita tamaños de payload, query string y URL

### Estado Actual

✅ **Funcionando:**
- `/auth/register` - Registro de usuarios
- `/auth/login` - Login de usuarios
- Sanitización de body y params
- Validación de query parameters

⚠️ **Temporalmente deshabilitado:**
- Sanitización automática de query parameters
- Protección HPP (HTTP Parameter Pollution)
- Sanitización NoSQL automática en query

### Recomendaciones Futuras

#### 1. Alternativas para NoSQL Protection

```typescript
// Implementar validación NoSQL personalizada
const validateNoSQLQuery = (obj: any) => {
  const noSQLPatterns = [
    /\$where/gi, /\$ne/gi, /\$gt/gi, /\$lt/gi,
    /\$gte/gi, /\$lte/gi, /\$in/gi, /\$nin/gi,
    /\$regex/gi, /\$exists/gi, /\$type/gi
  ];
  
  // Implementar lógica de validación sin modificar req.query
};
```

#### 2. HPP Protection Alternativo

```typescript
// Implementar protección HPP personalizada que no modifique req.query
const customHPPProtection = (req: Request, res: Response, next: NextFunction) => {
  // Validar parámetros duplicados sin modificar req.query
  // Rechazar requests con parámetros duplicados maliciosos
};
```

#### 3. Monitoreo y Logging

```typescript
// Agregar logging detallado para detectar intentos de ataque
const securityLogger = {
  logSuspiciousQuery: (query: any, ip: string) => {
    console.warn(`🚨 Query sospechoso detectado desde IP ${ip}:`, query);
  }
};
```

### Cómo Verificar que Funciona

1. **Probar endpoint de registro:**
```bash
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!",
    "firstName": "Test",
    "lastName": "User"
  }'
```

2. **Respuesta esperada:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "email": "test@example.com",
      "name": "Test User",
      "role": "admin",
      "status": "active"
    },
    "token": "..."
  },
  "message": "Usuario registrado exitosamente"
}
```

### Troubleshooting

Si sigues viendo el error:

1. **Verificar orden de middlewares** en `app.ts`
2. **Comprobar versiones** de express y middlewares de seguridad
3. **Revisar logs** para identificar qué middleware específico causa el problema
4. **Deshabilitar middlewares uno por uno** para identificar el culpable

### Configuración Actual en app.ts

```typescript
// Middlewares de parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Aplicar suite de sanitización (sin middlewares problemáticos)
fullSanitizationSuite.forEach(middleware => app.use(middleware));
```

Esta configuración evita el error mientras mantiene la seguridad de la aplicación.
