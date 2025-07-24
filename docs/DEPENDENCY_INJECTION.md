# Sistema de Inyección de Dependencias

Este proyecto implementa un sistema robusto de inyección de dependencias con soporte para múltiples bases de datos.

## 🏗️ Arquitectura

### Patrón Singleton del Contenedor DI
- **Container**: Gestiona todas las dependencias del sistema
- **Auto-detección**: Detecta automáticamente el tipo de base de datos según la configuración
- **Fallback graceful**: Si falla la conexión a BD, usa repositorio en memoria

### Repositorios Soportados
1. **InMemoryUserRepository**: Para desarrollo y testing
2. **MongoUserRepository**: Para MongoDB/MongoDB Atlas  
3. **MySQLUserRepository**: Para MySQL/MariaDB

## ⚙️ Configuración

### Variables de Entorno

#### Opción 1: URL de Conexión (Recomendado)
```bash
# MongoDB local
DATABASE_URL=mongodb://localhost:27017/templateapi

# MongoDB Atlas
DATABASE_URL=mongodb+srv://user:pass@cluster.mongodb.net/templateapi

# MySQL local  
DATABASE_URL=mysql://root:password@localhost:3306/templateapi

# MySQL producción con SSL
DATABASE_URL=mysql://user:pass@host:3306/templateapi?ssl=true
```

#### Opción 2: Variables Específicas

**Para MySQL:**
```bash
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=password
MYSQL_DATABASE=templateapi
MYSQL_SSL=false
```

**Para MongoDB:**
```bash
MONGODB_URI=mongodb://localhost:27017/templateapi
MONGODB_DATABASE=templateapi
```

### Sin Base de Datos
Si no configuras `DATABASE_URL`, el sistema usará automáticamente el repositorio en memoria.

## 🚀 Uso

### Inicialización Automática
El contenedor se inicializa automáticamente al arrancar la aplicación:

```typescript
// En app.ts
import { container } from './infrastructure/di/Container';

// Se inicializa automáticamente al arrancar
await container.initialize();
```

### Obtener Dependencias
```typescript
// En controladores
export class DatabaseAuthController extends BaseController {
  private get userRepository(): UserRepository {
    return container.getUserRepository();
  }
}
```

### Health Check
```typescript
// Verificar estado de las conexiones
const isHealthy = await container.healthCheck();
const stats = container.getConnectionStats();
```

## 🔄 Ciclo de Vida

### Inicialización
1. **Lectura de configuración**: Lee variables de entorno
2. **Detección automática**: Determina qué repositorio usar
3. **Conexión a BD**: Establece conexiones según el tipo detectado
4. **Fallback**: Si falla, usa repositorio en memoria
5. **Logging**: Informa del repositorio activo

### Cierre Graceful
```typescript
// Se ejecuta automáticamente al recibir SIGTERM/SIGINT
await container.cleanup();
```

## 📊 Monitoring

### Endpoints de Monitoreo
- `GET /auth/health` - Estado general de la base de datos
- `GET /auth/container/restart` - Reiniciar contenedor (solo dev/admin)

### Estadísticas Disponibles
```typescript
{
  isInitialized: boolean,
  repository: string,
  timestamp: string,
  mongodb?: MongoDBStats,
  mysql?: MySQLStats
}
```

## 🧪 Testing

### Cambiar Repositorio en Tests
```typescript
import { container } from '../infrastructure/di/Container';
import { InMemoryUserRepository } from '../infrastructure/repositories/InMemoryUserRepository';

// Solo en entornos de test/development
container.setRepository(new InMemoryUserRepository());
```

### Limpiar Estado
```typescript
// Reiniciar contenedor
await container.restart();

// Limpiar conexiones
await container.cleanup();
```

## 🔧 Troubleshooting

### Problemas Comunes

#### Error: "Contenedor DI no ha sido inicializado"
**Causa**: Se intenta usar el repositorio antes de la inicialización
**Solución**: Asegurar que `container.initialize()` se ejecute antes que los controladores

#### Conexión de BD Falla
**Comportamiento**: El sistema automáticamente usa repositorio en memoria
**Logs**: Verifica los logs para ver el fallback:
```
❌ Error conectando a MongoDB: ...
🔄 Fallback a repositorio en memoria
```

#### Múltiples Inicializaciones
**Comportamiento**: El contenedor detecta e ignora inicializaciones duplicadas
**Logs**: 
```
📦 Contenedor DI ya inicializado
```

### Variables de Entorno No Reconocidas
```bash
# ❌ Incorrecto
DATABASE_URL=postgresql://localhost:5432/db

# ✅ Correcto  
DATABASE_URL=mongodb://localhost:27017/templateapi
# o
DATABASE_URL=mysql://root:pass@localhost:3306/templateapi
```

## 🚨 Seguridad

### Producción
- ✅ Siempre configurar `JWT_SECRET`
- ✅ Usar URLs de conexión con SSL: `?ssl=true`
- ✅ No exponer credenciales en logs
- ✅ Validar variables de entorno críticas

### Desarrollo  
- ✅ Usar `.env.example` como base
- ✅ No commitear archivos `.env` reales
- ✅ Probar con repositorio en memoria

## 📈 Escalabilidad

### Pool de Conexiones
- **MongoDB**: Configurado con `maxPoolSize: 10`
- **MySQL**: Pool de 10 conexiones máximo
- **Reconexión automática**: Habilitada en ambos

### Manejo de Errores
- **Retry automático**: Para conexiones perdidas
- **Circuit breaker**: Fallback a repositorio en memoria
- **Logging detallado**: Para debugging

## 🔍 Debugging

### Logs Útiles
```bash
# Inicialización
🚀 Inicializando contenedor de inyección de dependencias...
🍃 Configurando MongoDB...
✅ MongoDB configurado exitosamente
📋 Repositorio activo: MongoUserRepository

# Health checks
✅ Login exitoso: { userId: '...', repository: 'MySQLUserRepository' }

# Errores
❌ Error conectando a MySQL: Connection refused
```

### Variables de Debug
```bash
NODE_ENV=development  # Habilita logs extra de Mongoose
LOG_LEVEL=debug       # Logs más verbosos
```
