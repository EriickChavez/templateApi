# 🛡️ Sistema de Manejo de Errores

## 📋 Descripción

Tu API ahora cuenta con un **sistema robusto de manejo de errores** que incluye:

- ✅ **Logger de errores** automático
- ✅ **Categorización** de errores por tipo
- ✅ **Respuestas consistentes** para el frontend
- ✅ **Captura global** de errores no manejados
- ✅ **Logging en archivo** (producción) y consola (desarrollo)

---

## 🚨 Tipos de Errores Disponibles

### 1. **Errores de Validación** (`VALIDATION_ERROR`)
```typescript
throw createError.validation('El email es inválido', { field: 'email', value: 'bad-email' });
```

### 2. **Recurso No Encontrado** (`NOT_FOUND_ERROR`)
```typescript
throw createError.notFound('Usuario'); // "Usuario no encontrado"
```

### 3. **No Autorizado** (`AUTHENTICATION_ERROR`)
```typescript
throw createError.unauthorized('Token expirado');
```

### 4. **Acceso Denegado** (`AUTHORIZATION_ERROR`)
```typescript
throw createError.forbidden('No tienes permisos de admin');
```

### 5. **Errores de Base de Datos** (`DATABASE_ERROR`)
```typescript
throw createError.database('Error conectando a MongoDB', { host: 'localhost' });
```

### 6. **Errores de APIs Externas** (`EXTERNAL_API_ERROR`)
```typescript
throw createError.external('PayPal API no disponible', { service: 'PayPal' });
```

### 7. **Rate Limiting** (`RATE_LIMIT_ERROR`)
```typescript
throw createError.rateLimit('Demasiadas peticiones por minuto');
```

---

## 🛠️ Cómo Usar en tus Controladores

### Método Básico
```typescript
import { createError, asyncHandler } from '../middlewares/errorHandler';

export const myController = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  if (!id) {
    throw createError.validation('ID es requerido');
  }
  
  const user = await User.findById(id);
  if (!user) {
    throw createError.notFound('Usuario');
  }
  
  return res.json({ success: true, data: user });
});
```

### Método Avanzado con Detalles
```typescript
export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  
  if (!email || !email.includes('@')) {
    throw createError.validation('Email inválido', {
      field: 'email',
      value: email,
      expected: 'formato: usuario@dominio.com'
    });
  }
  
  // Tu lógica aquí...
});
```

---

## 📤 Formato de Respuesta de Errores

### Desarrollo:
```json
{
  "success": false,
  "error": "Usuario no encontrado",
  "code": "NOT_FOUND_ERROR",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "details": { "userId": 123 },
  "stack": ["Error: Usuario no encontrado", "at UserController..."]
}
```

### Producción:
```json
{
  "success": false,
  "error": "Usuario no encontrado",
  "code": "NOT_FOUND_ERROR",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

## 🧪 Probar el Sistema de Errores

### Endpoint de Prueba
```bash
POST http://localhost:3000/test-error
Content-Type: application/json

{
  "type": "validation"
}
```

### Tipos disponibles para pruebas:
- `validation` - Error de validación
- `notFound` - Recurso no encontrado
- `unauthorized` - No autorizado
- `forbidden` - Acceso denegado
- `database` - Error de base de datos
- `external` - Error de API externa
- `rateLimit` - Límite de peticiones
- `unexpected` - Error inesperado

---

## 📁 Logs de Errores

### Desarrollo
Los errores se muestran en **consola** con detalles completos:
```
🚨 ERROR LOGGED: {
  message: 'Usuario no encontrado',
  code: 'NOT_FOUND_ERROR',
  statusCode: 404,
  url: '/users/123',
  method: 'GET',
  timestamp: '2024-01-15T10:30:00.000Z'
}
```

### Producción
Los errores se guardan en el archivo `logs/errors.log`:
```json
{"timestamp":"2024-01-15T10:30:00.000Z","message":"Usuario no encontrado","stack":"Error: Usuario no encontrado...","statusCode":404,"code":"NOT_FOUND_ERROR","request":{"method":"GET","url":"/users/123","ip":"127.0.0.1"}}
```

---

## 🔧 Manejo de Errores No Capturados

El sistema captura automáticamente:

### ❌ Excepciones no capturadas
```typescript
process.on('uncaughtException', async (error) => {
  // Se loggea automáticamente
  // En producción, la app se cierra elegantemente
});
```

### ❌ Promesas rechazadas
```typescript
process.on('unhandledRejection', async (reason, promise) => {
  // Se loggea automáticamente
  // En producción, la app se cierra elegantemente
});
```

---

## 📊 Códigos de Estado HTTP

| Tipo de Error | Código HTTP | Descripción |
|---------------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Bad Request |
| `AUTHENTICATION_ERROR` | 401 | Unauthorized |
| `AUTHORIZATION_ERROR` | 403 | Forbidden |
| `NOT_FOUND_ERROR` | 404 | Not Found |
| `RATE_LIMIT_ERROR` | 429 | Too Many Requests |
| `INTERNAL_ERROR` | 500 | Internal Server Error |
| `DATABASE_ERROR` | 500 | Internal Server Error |
| `EXTERNAL_API_ERROR` | 502 | Bad Gateway |

---

## 🎯 Mejores Prácticas

### ✅ DO (Hacer)
```typescript
// Usa errores específicos
throw createError.validation('Email requerido');

// Incluye detalles útiles
throw createError.database('Connection failed', { host: 'localhost', port: 5432 });

// Usa asyncHandler en todos los controladores
export const myController = asyncHandler(async (req, res) => {
  // tu código aquí
});
```

### ❌ DON'T (No hacer)
```typescript
// No uses errores genéricos
throw new Error('Something went wrong');

// No envíes respuestas manuales en caso de error
res.status(500).json({ error: 'Bad' }); // El middleware se encarga

// No olvides usar asyncHandler
export const badController = async (req, res) => {
  // Si hay error, no se capturará automáticamente
};
```

---

## 🔍 Monitoreo

### Logs en Tiempo Real (Desarrollo)
```bash
# Observar logs en consola
npm run dev
```

### Logs en Archivo (Producción)
```bash
# Ver logs de errores
tail -f logs/errors.log

# Buscar errores específicos
grep "VALIDATION_ERROR" logs/errors.log
```

---

¡Tu API ahora es **mucho más robusta** y **fácil de debuggear**! 🚀
