# 🏗️ Arquitectura del Proyecto

## Patrón de Arquitectura: Hexagonal + MVC

Esta plantilla utiliza una **arquitectura hexagonal** (también conocida como Clean Architecture) combinada con el patrón **MVC**, adaptada específicamente para APIs REST.

## 📁 Estructura de Carpetas

```
src/
├── config/          # Configuraciones de la aplicación
│   └── env.ts       # Variables de entorno
├── controllers/     # Capa de presentación (HTTP)
│   ├── BaseController.ts
│   └── AppController.ts
├── services/        # Lógica de negocio
│   ├── BaseService.ts
│   └── AppService.ts
├── repositories/    # Capa de acceso a datos
├── models/          # Entidades y DTOs
├── middlewares/     # Middlewares personalizados
│   └── errorHandler.ts
├── routes/          # Definición de rutas
│   ├── index.ts
│   └── appRoutes.ts
├── utils/           # Utilidades y helpers
│   └── response.ts
├── types/           # Tipos TypeScript
│   └── index.ts
└── app.ts          # Archivo principal
```

## 🔄 Flujo de Datos

```
Client Request
      ↓
  [Middlewares]
      ↓
  [Routes] → [Controllers] → [Services] → [Repositories]
      ↓              ↓           ↓            ↓
  Response    ←   Response   ←  Business   ← Data Access
                                Logic
```

## 📋 Responsabilidades por Capa

### 🎛️ **Controllers (Controladores)**
- **Responsabilidad**: Manejar requests/responses HTTP
- **Qué hace**: 
  - Validar parámetros de entrada
  - Llamar servicios
  - Formatear respuestas
- **No hace**: Lógica de negocio, acceso directo a datos

### 🧠 **Services (Servicios)**
- **Responsabilidad**: Lógica de negocio
- **Qué hace**:
  - Validaciones complejas
  - Orquestación de operaciones
  - Transformación de datos
- **No hace**: Manejo HTTP, acceso directo a datos

### 🗄️ **Repositories (Repositorios)**
- **Responsabilidad**: Acceso a datos
- **Qué hace**:
  - CRUD operations
  - Queries específicas
  - Abstracción de la base de datos
- **No hace**: Lógica de negocio

### 🔧 **Middlewares**
- **Responsabilidad**: Funcionalidad transversal
- **Ejemplos**: Autenticación, logging, validación, CORS

### 🛣️ **Routes (Rutas)**
- **Responsabilidad**: Definir endpoints
- **Qué hace**: Mapear URLs a controladores

## 🎯 Principios Aplicados

### 1. **Separación de Responsabilidades**
Cada capa tiene una responsabilidad específica y bien definida.

### 2. **Inversión de Dependencias**
Las capas internas no dependen de las externas.

### 3. **Principio Abierto/Cerrado**
Fácil de extender, difícil de romper.

### 4. **Single Responsibility Principle**
Cada clase tiene una sola razón para cambiar.

## 🚀 Ventajas de esta Arquitectura

### ✅ **Escalabilidad**
- Fácil agregar nuevas funcionalidades
- Estructura clara y organizada

### ✅ **Mantenibilidad**
- Código bien organizado
- Fácil de debuggear y testear

### ✅ **Testabilidad**
- Capas desacopladas
- Fácil crear mocks

### ✅ **Reutilización**
- Componentes reutilizables
- Base sólida para futuras APIs

### ✅ **Flexibilidad**
- Fácil cambiar implementaciones
- Independiente de frameworks específicos

## 📚 Ejemplo de Uso

### Agregar Nueva Funcionalidad (Usuarios)

1. **Modelo** (`src/models/User.ts`):
```typescript
export interface User {
  id: string;
  name: string;
  email: string;
}
```

2. **Repositorio** (`src/repositories/UserRepository.ts`):
```typescript
export class UserRepository implements Repository<User> {
  async findAll(): Promise<User[]> { /* implementación */ }
  async findById(id: string): Promise<User | null> { /* implementación */ }
  // ...
}
```

3. **Servicio** (`src/services/UserService.ts`):
```typescript
export class UserService extends BaseService {
  constructor(private userRepo: UserRepository) { super(); }
  
  async getUsers(): Promise<ServiceResponse<User[]>> {
    // lógica de negocio
  }
}
```

4. **Controlador** (`src/controllers/UserController.ts`):
```typescript
export class UserController extends BaseController {
  constructor(private userService: UserService) { super(); }
  
  getUsers = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.userService.getUsers();
    return this.handleServiceResponse(res, result);
  });
}
```

5. **Rutas** (`src/routes/userRoutes.ts`):
```typescript
const router = Router();
const userController = new UserController(userService);
router.get('/', userController.getUsers);
```

## 🔮 Próximos Pasos Recomendados

1. **Validación**: Agregar librería como Joi o Zod
2. **Base de Datos**: Implementar repositorios para MongoDB/PostgreSQL
3. **Autenticación**: JWT + middleware de autenticación
4. **Testing**: Jest + supertest
5. **Documentación**: Swagger/OpenAPI
6. **Logging**: Winston o similar
7. **Rate Limiting**: Express-rate-limit
8. **Caching**: Redis integration

Esta arquitectura te proporciona una base sólida y escalable para cualquier API que desarrolles en el futuro.
