import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Template API',
      version: '1.0.0',
      description: `
        Una API completa con autenticación JWT, control de roles y arquitectura hexagonal.
        
        ## Características
        - 🏗️ **Arquitectura Hexagonal** con inyección de dependencias
        - 🔐 **Autenticación JWT** completa con roles
        - 🗄️ **Multi-Base de Datos**: InMemory, MongoDB, MySQL
        - 🛡️ **Sistema de Seguridad** robusto con rate limiting
        - 👥 **Control de Roles**: Admin, Moderator, User, Guest
        - 📊 **Health Checks** y monitoreo integrado
        
        ## Autenticación
        Para usar endpoints protegidos, incluye el header:
        \`Authorization: Bearer <tu-jwt-token>\`
        
        ## Roles disponibles
        - **Admin**: Control total del sistema
        - **Moderator**: Gestión de contenido
        - **User**: Usuario estándar
        - **Guest**: Solo lectura
      `,
      contact: {
        name: 'API Support',
        email: 'support@templateapi.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:4000',
        description: 'Servidor de desarrollo'
      },
      {
        url: 'https://api.templateapi.com',
        description: 'Servidor de producción'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Ingresa tu JWT token'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'ID único del usuario'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email del usuario'
            },
            firstName: {
              type: 'string',
              description: 'Nombre del usuario'
            },
            lastName: {
              type: 'string',
              description: 'Apellido del usuario'
            },
            role: {
              type: 'string',
              enum: ['Admin', 'Moderator', 'User', 'Guest'],
              description: 'Rol del usuario'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de creación'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha de última actualización'
            }
          },
          required: ['id', 'email', 'firstName', 'lastName', 'role']
        },
        LoginRequest: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'Email del usuario'
            },
            password: {
              type: 'string',
              minLength: 6,
              description: 'Contraseña del usuario'
            }
          },
          required: ['email', 'password']
        },
        RegisterRequest: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'Email único del usuario'
            },
            password: {
              type: 'string',
              minLength: 6,
              description: 'Contraseña segura'
            },
            firstName: {
              type: 'string',
              minLength: 2,
              description: 'Nombre del usuario'
            },
            lastName: {
              type: 'string',
              minLength: 2,
              description: 'Apellido del usuario'
            }
          },
          required: ['email', 'password', 'firstName', 'lastName']
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Indica si la operación fue exitosa'
            },
            message: {
              type: 'string',
              description: 'Mensaje descriptivo'
            },
            data: {
              type: 'object',
              properties: {
                token: {
                  type: 'string',
                  description: 'JWT token para autenticación'
                },
                user: {
                  $ref: '#/components/schemas/User'
                }
              }
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              description: 'Mensaje de error'
            },
            error: {
              type: 'string',
              description: 'Código de error'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Timestamp del error'
            }
          }
        },
        HealthResponse: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['OK', 'ERROR'],
              description: 'Estado del sistema'
            },
            timestamp: {
              type: 'string',
              format: 'date-time'
            },
            uptime: {
              type: 'number',
              description: 'Tiempo de actividad en segundos'
            },
            version: {
              type: 'string',
              description: 'Versión de la API'
            },
            database: {
              type: 'object',
              properties: {
                status: {
                  type: 'string',
                  enum: ['connected', 'disconnected', 'error']
                },
                type: {
                  type: 'string',
                  enum: ['mongodb', 'mysql', 'inmemory']
                }
              }
            }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Token de acceso faltante o inválido',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                message: 'Token de autenticación requerido',
                error: 'UNAUTHORIZED',
                timestamp: '2024-01-01T00:00:00.000Z'
              }
            }
          }
        },
        ForbiddenError: {
          description: 'Acceso denegado - permisos insuficientes',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                message: 'No tienes permisos para acceder a este recurso',
                error: 'FORBIDDEN',
                timestamp: '2024-01-01T00:00:00.000Z'
              }
            }
          }
        },
        ValidationError: {
          description: 'Error de validación en los datos enviados',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                message: 'Datos de entrada inválidos',
                error: 'VALIDATION_ERROR',
                timestamp: '2024-01-01T00:00:00.000Z'
              }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: ['./src/routes/*.ts'] // Archivos donde se encuentran las anotaciones
};

export const swaggerSpec = swaggerJsdoc(options);
export const swaggerUiHandler = swaggerUi.setup(swaggerSpec);
