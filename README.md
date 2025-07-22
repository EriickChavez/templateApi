# Template API - Hola Mundo

Una API simple en Node.js con Express y TypeScript que responde "Hola Mundo".

## 🚀 Características

- **Express.js** para el servidor web
- **TypeScript** para tipado estático
- **Nodemon** para desarrollo con recarga automática
- **Endpoints RESTful** básicos

## 📋 Requisitos

- Node.js (v16 o superior)
- npm o yarn

## 🛠️ Instalación

```bash
# Clonar el repositorio
git clone <tu-repo-url>
cd templateApi

# Instalar dependencias
npm install
```

## 🚀 Uso

### Modo Desarrollo
```bash
npm run dev
```

### Modo Producción
```bash
# Compilar TypeScript
npm run build

# Ejecutar la versión compilada
npm start
```

### Ejecutar directamente con ts-node
```bash
npm run start:dev
```

## 📝 Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/` | Hola Mundo básico con información del entorno |
| GET | `/saludo/:nombre` | Saludo personalizado |
| GET | `/health` | Estado de la API con información del sistema |
| GET | `/config` | Configuración actual (solo en desarrollo) |

## 📁 Estructura del Proyecto

```
templateApi/
├── src/
│   ├── config/
│   │   └── env.ts      # Configuración de variables de entorno
│   └── app.ts          # Archivo principal del servidor
├── dist/               # Archivos compilados (generados)
├── .env                # Variables de entorno (local)
├── .env.example        # Ejemplo de variables de entorno
├── .gitignore          # Archivos ignorados por git
├── package.json        # Configuración del proyecto
├── tsconfig.json       # Configuración de TypeScript
└── README.md          # Este archivo
```

## 🌍 Variables de Entorno

El proyecto usa variables de entorno para la configuración. Copia el archivo de ejemplo:

```bash
cp .env.example .env
```

### Variables Disponibles

| Variable | Descripción | Valor por Defecto |
|----------|-------------|-------------------|
| `PORT` | Puerto del servidor | `3000` |
| `NODE_ENV` | Entorno de ejecución | `development` |
| `API_VERSION` | Versión de la API | `v1` |
| `CORS_ORIGIN` | Origen permitido para CORS | `*` |
| `LOG_LEVEL` | Nivel de logging | `info` |
| `DATABASE_URL` | URL de la base de datos | _opcional_ |
| `JWT_SECRET` | Secreto para JWT | _opcional_ |

### Configuración de Desarrollo

Para desarrollo local, crea un archivo `.env` con:

```bash
PORT=3000
NODE_ENV=development
API_VERSION=v1
CORS_ORIGIN=*
LOG_LEVEL=info
```

## 🔧 Scripts Disponibles

- `npm run dev` - Inicia el servidor en modo desarrollo con nodemon
- `npm run build` - Compila TypeScript a JavaScript
- `npm start` - Ejecuta la versión compilada
- `npm run start:dev` - Ejecuta directamente con ts-node

## 🌐 URLs de Prueba

Una vez que el servidor esté corriendo:

- http://localhost:3000/ - Hola Mundo
- http://localhost:3000/saludo/EriickChavez - Saludo personalizado
- http://localhost:3000/health - Estado de la API
