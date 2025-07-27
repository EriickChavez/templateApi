# Guía para Agregar Endpoints Nuevos 

¡Bienvenido! Vamos a crear un nuevo endpoint paso a paso. No te preocupes si eres nuevo en esto, vamos a hacerlo fácil.

## Agregar un Endpoint Nuevo

### Paso 1: Decide qué quieres que haga el endpoint
- Imagina qué hará el nuevo endpoint. Ejemplo: "Quiero un endpoint que me diga la hora."

### Paso 2: Encuentra el archivo de rutas
- Ve a `src/routes/appRoutes.ts` (¡es como un índice de direcciones!).

### Paso 3: Agrega la nueva ruta
```typescript
import express from 'express';
const router = express.Router();

// Endpoint que te dice la hora
router.get('/hora', (req, res) => {
  const ahora = new Date();
  res.send(`La hora actual es: ${ahora.toLocaleTimeString()}`);
});

export default router;
```

### Paso 4: Verifica que funcione
- Guarda los cambios y corre tu aplicación.
- Abre el navegador y ve a `http://localhost:4000/hora`.
- ¡Voila! Debes ver un texto que dice la hora.

## Crear una Nueva Inyección (o usar una existente)

### Qué es la Inyección de Dependencias
- Imagina que tienes un robot que necesita herramientas diferentes. 
- La "inyección" es quien le da las herramientas al robot según las necesite.

### Usar Inyección Existente
- Todas las herramientas (dependencias) se manejan en `DIContainer`. 
- Por ejemplo, para usar la base de datos:

```typescript
import { container } from './infrastructure/di/Container';
// Obteniendo un repositorio de usuarios
const userRepo = container.getUserRepository();
```

### Crear una Nueva Inyección
- Si necesitas una herramienta nueva para el robot, la añades al contenedor.

#### Paso 1: Define una nueva herramienta (ej. "Calculadora")
- Crea la clase de la calculadora:

```typescript
export class Calculadora {
  sumar(a: number, b: number) {
    return a + b;
  }
}
```

#### Paso 2: Añádela al contenedor
- Abre `src/infrastructure/di/Container.ts`.
- Registra la nueva herramienta:

```typescript
import { Calculadora } from './path/to/calculadora';

class DIContainer {
  private calculadora = new Calculadora();

  getCalculadora(): Calculadora {
    return this.calculadora;
  }
}
```

#### Paso 3: Usa la herramienta donde la necesites
```typescript
import { container } from './infrastructure/di/Container';
const calculadora = container.getCalculadora();
console.log(calculadora.sumar(2, 3)); // Esto mostrará 5
```

## Agregar Documentación Swagger

### Para que tu endpoint aparezca en la documentación:
```typescript
/**
 * @swagger
 * /mi-endpoint:
 *   get:
 *     summary: Descripción de mi endpoint
 *     tags: [Mi Categoría]
 *     responses:
 *       200:
 *         description: Respuesta exitosa
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
router.get('/mi-endpoint', (req, res) => {
  res.json({ message: 'Mi respuesta' });
});
```

## Agregar Sanitización a tu endpoint

### Para proteger contra ataques:
```typescript
import { sanitizationPresets } from '../middlewares/advancedSanitization';

// Usar preset existente
router.post('/mi-endpoint', sanitizationPresets.auth, miControlador.crear);

// O crear tu propia sanitización
router.post('/mi-endpoint', routeSpecificSanitization({
  body: {
    nombre: 'name',
    email: 'email',
    contenido: 'text'
  }
}), miControlador.crear);
```

## Agregar Búsqueda a tus datos

### Cómo hacer que tu contenido sea buscable:
```typescript
import { searchWithElasticsearch, searchWithFuse } from '../services/searchService';
import { isElasticsearchConnected } from '../config/elasticsearch';

export class MiController {
  async buscar(req: Request, res: Response) {
    const { query, filters } = req.query;
    
    let resultados = [];
    
    if (isElasticsearchConnected()) {
      // Buscar en Elasticsearch
      resultados = await searchWithElasticsearch('mi-indice', query, filters);
    } else {
      // Buscar en memoria
      const misDatos = await this.obtenerDatos();
      resultados = searchWithFuse(misDatos, query, filters);
    }
    
    res.json({ success: true, data: resultados });
  }
}
```

### Y eso es todo, amigo! 🎉
- Has creado un nuevo endpoint y entendido cómo usar la inyección de dependencias.
- Has agregado documentación Swagger para que otros puedan usar tu API fácilmente.
- Has protegido tu endpoint contra ataques con sanitización avanzada.
- Has hecho tu contenido buscable con el sistema de búsqueda integrado.
- ¡Ahora estás listo para construir cosas increíbles y seguras!
