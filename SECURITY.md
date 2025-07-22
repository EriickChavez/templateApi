# 🔐 Seguridad de la API

## Medidas de Seguridad Implementadas

### 1. 🛡️ **Headers de Seguridad (Helmet)**
- **Content Security Policy (CSP)**: Previene ataques XSS
- **HTTP Strict Transport Security (HSTS)**: Fuerza HTTPS
- **X-Content-Type-Options**: Previene MIME sniffing
- **X-Frame-Options**: Previene clickjacking
- **X-XSS-Protection**: Protección XSS del navegador

### 2. 🚦 **Rate Limiting**
- **Límite General**: 100 requests por IP cada 15 minutos
- **Límite de Autenticación**: 5 intentos por IP cada 15 minutos
- **Respuesta 429**: Con información del retry-after
- **Configuración por entorno**: Más permisivo en desarrollo

### 3. 🌐 **CORS (Cross-Origin Resource Sharing)**
- **Orígenes controlados**: Lista configurable por entorno
- **Métodos permitidos**: GET, POST, PUT, DELETE, OPTIONS
- **Credenciales**: Soporte para cookies y headers de auth
- **Headers permitidos**: Content-Type, Authorization, X-Requested-With

### 4. 🔑 **Autenticación JWT**
- **Encriptación fuerte**: bcrypt con salt rounds 12
- **Tokens seguros**: JWT con issuer y audience
- **Expiración**: 24h por defecto, configurable
- **Refresh tokens**: Para renovación segura
- **Middleware flexible**: Autenticación obligatoria y opcional

### 5. ✅ **Validación de Datos**
- **Express-validator**: Validación robusta de entrada
- **Sanitización**: Limpieza automática de XSS
- **Validación de tipos**: Emails, UUIDs, ObjectIds
- **Validación de archivos**: Tipo y tamaño de uploads
- **Mensajes de error**: Descriptivos pero seguros

### 6. 🧹 **Sanitización**
- **Escape HTML**: Prevención de XSS
- **Limpieza de entrada**: Remoción de scripts maliciosos
- **Validación de Content-Type**: JSON obligatorio en POST/PUT
- **Límites de payload**: 10MB máximo

### 7. 📊 **Logging de Seguridad**
- **Requests sospechosos**: Path traversal, XSS attempts
- **Intentos de autenticación**: IP, User-Agent, timestamp
- **Errores de seguridad**: Log detallado en desarrollo
- **Headers de trazabilidad**: Request ID para debugging

## 🔧 Configuración de Seguridad

### Variables de Entorno Críticas

```bash
# JWT (OBLIGATORIO en producción)
JWT_SECRET=tu-secreto-super-largo-minimo-32-caracteres
JWT_EXPIRES_IN=24h

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutos
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_AUTH_MAX=5

# CORS (producción debe ser específico)
CORS_ORIGIN=https://tudominio.com,https://app.tudominio.com

# API Keys (opcional)
VALID_API_KEYS=key1,key2,key3
```

### Niveles de Acceso

#### 🟢 **Público**
- `GET /` - Información básica
- `GET /health` - Estado de salud

#### 🟡 **Validado**
- `GET /saludo/:nombre` - Con validación de entrada

#### 🔴 **Restringido**
- `GET /config` - Solo en desarrollo

## 🚨 Recomendaciones de Producción

### 1. **Variables de Entorno**
```bash
# ❌ NUNCA en producción
JWT_SECRET=password123
CORS_ORIGIN=*

# ✅ Correcto para producción  
JWT_SECRET=una-clave-super-larga-aleatoria-de-al-menos-32-caracteres
CORS_ORIGIN=https://tuapp.com,https://admin.tuapp.com
```

### 2. **HTTPS Obligatorio**
- Usar certificados SSL/TLS válidos
- Redirect automático HTTP → HTTPS
- HSTS preload en navegadores

### 3. **Base de Datos**
- Conexiones encriptadas (SSL/TLS)
- Usuarios con mínimos privilegios
- Backups encriptados
- Logs de auditoría

### 4. **Monitoreo**
- Alertas por intentos de brute force
- Logs centralizados (ELK, Splunk)
- Métricas de seguridad (Prometheus)
- Escaneo de vulnerabilidades

## 🛠️ Uso de Middlewares

### Autenticación Obligatoria
```typescript
import { authenticateToken } from '../middlewares/auth';

router.get('/protected', authenticateToken, controller.method);
```

### Autenticación Opcional
```typescript
import { optionalAuth } from '../middlewares/auth';

router.get('/maybe-protected', optionalAuth, controller.method);
```

### Verificación de Roles
```typescript
import { authenticateToken, requireRole } from '../middlewares/auth';

router.get('/admin', 
  authenticateToken, 
  requireRole(['admin', 'moderator']), 
  controller.adminMethod
);
```

### Rate Limiting Específico
```typescript
import { authLimiter } from '../middlewares/security';

router.post('/login', authLimiter, controller.login);
```

### Validación Completa
```typescript
import { validateLogin } from '../middlewares/validators';

router.post('/login', 
  authLimiter,           // Rate limiting
  validateLogin,         // Validación
  controller.login       // Controlador
);
```

## 🔒 Generación de JWT

```typescript
import { AuthUtils } from '../utils/auth';

// Generar token
const token = AuthUtils.generateToken({
  userId: user.id,
  email: user.email,
  role: user.role
});

// Verificar token
try {
  const decoded = AuthUtils.verifyToken(token);
  console.log(decoded); // { userId, email, role, iat, exp }
} catch (error) {
  console.error('Token inválido:', error.message);
}
```

## 🔐 Encriptación de Passwords

```typescript
import { AuthUtils } from '../utils/auth';

// Registrar usuario
const hashedPassword = await AuthUtils.hashPassword(plainPassword);

// Login
const isValid = await AuthUtils.comparePassword(plainPassword, hashedPassword);
```

## 🚀 Próximas Mejoras Recomendadas

1. **OAuth 2.0**: Google, GitHub, etc.
2. **2FA/MFA**: Autenticación de dos factores
3. **API Versioning**: Control de versiones
4. **Request Signing**: Firma de requests críticos
5. **Audit Logs**: Logs detallados de acciones
6. **Secrets Management**: HashiCorp Vault, AWS Secrets
7. **Container Security**: Docker security best practices
8. **WAF**: Web Application Firewall

Esta implementación te proporciona una base sólida de seguridad para cualquier API en producción.
