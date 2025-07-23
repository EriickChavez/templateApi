# 🏗️ Arquitectura de Dominio (Domain Driven Design)

## 📋 Descripción

Tu API ahora implementa **Domain Driven Design (DDD)** con una arquitectura limpia que incluye:

- ✅ **Entidades** con lógica de negocio encapsulada
- ✅ **Value Objects** para tipos de datos complejos
- ✅ **Repositorios** para abstracción de datos
- ✅ **Servicios de Dominio** para lógica de negocio compleja
- ✅ **Eventos de Dominio** para comunicación entre bounded contexts
- ✅ **Separación clara** entre dominio e infraestructura

---

## 📁 Estructura del Dominio

```
src/domain/
├── entities/           # Entidades del dominio
│   ├── BaseEntity.ts   # Clase base para todas las entidades
│   └── User.ts         # Entidad Usuario
├── value-objects/      # Objetos de valor
│   ├── ValueObject.ts  # Clase base para value objects
│   ├── Email.ts        # Value object para emails
│   └── PersonName.ts   # Value object para nombres
├── repositories/       # Interfaces de repositorios
│   └── UserRepository.ts
├── services/          # Servicios de dominio
│   └── UserDomainService.ts
└── events/            # Eventos de dominio
    ├── DomainEvent.ts
    ├── UserCreatedEvent.ts
    └── UserUpdatedEvent.ts
```

---

## 🏛️ Conceptos Clave

### 1. **Entidades (Entities)**
Las entidades son objetos con identidad única que encapsulan lógica de negocio.

```typescript
// ✅ BUENO: Lógica de negocio en la entidad
const user = new User({ email, name, role });
user.activate();        // Lógica encapsulada
user.changeRole(role);  // Validaciones incluidas

// ❌ MALO: Lógica dispersa
user.status = 'active'; // Sin validaciones
```

### 2. **Value Objects**
Objetos inmutables que representan conceptos del dominio sin identidad propia.

```typescript
// ✅ BUENO: Value object con validaciones
const email = new Email('user@example.com'); // Se valida automáticamente
const name = new PersonName({ firstName: 'Juan', lastName: 'Pérez' });

// ❌ MALO: Strings primitivos sin validación
const email = 'user@example.com'; // Puede ser inválido
```

### 3. **Repositorios**
Abstracciones para el acceso a datos que mantienen el dominio independiente de la infraestructura.

```typescript
// Interface en el dominio (NO implementación)
interface UserRepository {
  save(user: User): Promise<User>;
  findById(id: string): Promise<User | null>;
}

// Implementación en infraestructura
class InMemoryUserRepository implements UserRepository {
  // Implementación específica
}
```

### 4. **Servicios de Dominio**
Contienen lógica de negocio que no pertenece a una entidad específica.

```typescript
class UserDomainService {
  async createUser(userData): Promise<User> {
    // Validaciones complejas
    // Reglas de negocio que involucran múltiples entidades
    // Coordinación de operaciones
  }
}
```

### 5. **Eventos de Dominio**
Comunican cambios importantes en el dominio a otros bounded contexts.

```typescript
class User extends BaseEntity {
  activate() {
    this.status = UserStatus.ACTIVE;
    this.addDomainEvent(new UserActivatedEvent(this.id, this.version));
  }
}
```

---

## 🚀 Cómo Usar

### Crear un Usuario
```typescript
POST /users
{
  "email": "usuario@ejemplo.com",
  "firstName": "Juan",
  "lastName": "Pérez",
  "role": "user"
}
```

### Crear Usuarios de Demostración
```typescript
POST /users/demo
// Crea usuarios de ejemplo con diferentes roles
```

### Buscar Usuarios
```typescript
GET /users?role=admin&status=active&limit=10
```

### Obtener Estadísticas
```typescript
GET /users/stats
// Retorna contadores por estado y rol
```

### Cambiar Rol de Usuario
```typescript
PUT /users/:id/role
{
  "role": "admin"
}
```

### Activar/Desactivar Usuario
```typescript
PUT /users/:id/toggle-status
{
  "activate": false
}
```

---

## 📝 Ejemplos de Validaciones del Dominio

### Email Value Object
```typescript
const email = new Email('invalid-email'); 
// ❌ Lanza: ValidationError - Formato de email inválido

const email = new Email('user@domain.com'); 
// ✅ Válido
console.log(email.getDomain()); // 'domain.com'
console.log(email.isCorporate()); // true (no es gmail, yahoo, etc.)
```

### PersonName Value Object
```typescript
const name = new PersonName({
  firstName: 'J',  // ❌ Muy corto
  lastName: 'Doe'
}); 
// Lanza: ValidationError - El nombre debe tener al menos 2 caracteres

const name = new PersonName({
  firstName: 'John',
  lastName: 'Doe',
  middleName: 'William'
});
console.log(name.getFullName()); // 'John William Doe'
console.log(name.getInitials()); // 'JD'
```

### User Entity
```typescript
const user = User.fromObject({
  email: 'admin@company.com',
  firstName: 'Carlos',
  lastName: 'Admin',
  role: UserRole.ADMIN
});

// Métodos de negocio
user.activate();                    // Cambia estado y emite evento
user.changeRole(UserRole.USER);     // Validaciones de reglas de negocio
user.updateEmail(new Email('new@email.com')); // Reset verificación

// Consultas
console.log(user.canPerform('delete')); // true (es admin)
console.log(user.isActive());           // true
console.log(user.displayName);          // 'Carlos Admin'
```

---

## 🛡️ Reglas de Negocio Implementadas

### Usuarios
1. **Email único** - No puede haber dos usuarios con el mismo email
2. **Admin único** - No se puede eliminar el último admin
3. **Roles jerárquicos** - Los moderadores no pueden modificar admins
4. **Auto-modificación restringida** - Los admins no pueden quitarse su propio rol si son los únicos
5. **Estados válidos** - Solo transiciones válidas entre estados
6. **Verificación de email** - Se resetea al cambiar email

### Value Objects
1. **Email válido** - Formato RFC compliant
2. **Nombres mínimos** - Al menos 2 caracteres
3. **Solo caracteres válidos** - Letras, espacios, acentos
4. **Longitud máxima** - Limits razonables para campos

---

## 🧪 Testing

### Crear y Probar Usuario
```typescript
// 1. Crear usuarios de demostración
POST /users/demo

// 2. Obtener estadísticas
GET /users/stats

// 3. Buscar usuarios
GET /users?name=Carlos

// 4. Verificar permisos
GET /users/:userId/permissions/delete
```

### Probar Validaciones
```typescript
// Email inválido
POST /users
{
  "email": "invalid-email",
  "firstName": "Test",
  "lastName": "User"
}
// ❌ Retorna: ValidationError con detalles

// Nombre muy corto
POST /users
{
  "email": "test@valid.com",
  "firstName": "A",
  "lastName": "User"
}
// ❌ Retorna: ValidationError - nombre muy corto
```

---

## 🔄 Eventos de Dominio

Los eventos se generan automáticamente:

```typescript
// Al crear usuario
new UserCreatedEvent(userId, version, {
  email: 'user@example.com',
  name: 'John Doe',
  role: 'user'
});

// Al actualizar usuario
new UserUpdatedEvent(userId, version, {
  field: 'email',
  oldValue: 'old@email.com',
  newValue: 'new@email.com'
});
```

Los eventos se pueden usar para:
- 📧 Enviar emails de bienvenida
- 📊 Actualizar estadísticas
- 🔄 Sincronizar con otros sistemas
- 📝 Auditoría de cambios

---

## 🎯 Ventajas de esta Arquitectura

### ✅ Beneficios
- **Lógica centralizada** - Reglas de negocio en un solo lugar
- **Testing fácil** - Dominio independiente de infraestructura
- **Código expresivo** - El código refleja el lenguaje del negocio
- **Extensible** - Fácil agregar nuevas reglas y validaciones
- **Mantenible** - Cambios localizados y controlados
- **Type Safety** - TypeScript asegura tipos correctos

### 🚀 Escalabilidad
- Fácil agregar nuevos bounded contexts
- Servicios de dominio pueden evolucionar independientemente  
- Repositorios pueden cambiar de implementación sin afectar dominio
- Eventos permiten arquitectura basada en eventos

---

¡Tu API ahora tiene una **arquitectura robusta y profesional** que puede crecer con tu aplicación! 🌟
