import { Client } from '@elastic/elasticsearch';
import { config } from './env';

// Configuración de Elasticsearch
export const elasticsearchConfig = {
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
  auth: process.env.ELASTICSEARCH_AUTH ? {
    username: process.env.ELASTICSEARCH_USERNAME || 'elastic',
    password: process.env.ELASTICSEARCH_PASSWORD || 'changeme'
  } : undefined,
  requestTimeout: 30000,
  pingTimeout: 3000,
  maxRetries: 3,
  ssl: process.env.ELASTICSEARCH_SSL === 'true' ? {
    rejectUnauthorized: false // Para desarrollo, en producción debería ser true
  } : undefined
};

// Cliente de Elasticsearch
let elasticsearchClient: Client | null = null;
let isElasticsearchAvailable = false;

/**
 * Inicializar cliente de Elasticsearch
 */
export const initializeElasticsearch = async (): Promise<void> => {
  try {
    if (!process.env.ELASTICSEARCH_URL) {
      console.log('ℹ️ Elasticsearch URL no configurada, usando búsqueda en memoria');
      return;
    }

    elasticsearchClient = new Client(elasticsearchConfig);
    
    // Verificar conexión
    const health = await elasticsearchClient.ping();
    if (health) {
      isElasticsearchAvailable = true;
      console.log('✅ Elasticsearch conectado exitosamente');
      
      // Crear índices si no existen
      await createIndicesIfNotExist();
    }
  } catch (error) {
    console.warn('⚠️ No se pudo conectar a Elasticsearch, usando búsqueda en memoria:', error);
    elasticsearchClient = null;
    isElasticsearchAvailable = false;
  }
};

/**
 * Obtener cliente de Elasticsearch
 */
export const getElasticsearchClient = (): Client | null => {
  return elasticsearchClient;
};

/**
 * Verificar si Elasticsearch está disponible
 */
export const isElasticsearchConnected = (): boolean => {
  return isElasticsearchAvailable;
};

/**
 * Crear índices necesarios si no existen
 */
const createIndicesIfNotExist = async (): Promise<void> => {
  if (!elasticsearchClient) return;

  const indices = [
    {
      index: 'users',
      mapping: {
        properties: {
          id: { type: 'keyword' },
          email: { type: 'text', analyzer: 'standard' },
          firstName: { type: 'text', analyzer: 'standard' },
          lastName: { type: 'text', analyzer: 'standard' },
          fullName: { type: 'text', analyzer: 'standard' },
          role: { type: 'keyword' },
          status: { type: 'keyword' },
          createdAt: { type: 'date' },
          updatedAt: { type: 'date' },
          isEmailVerified: { type: 'boolean' }
        }
      }
    },
    {
      index: 'content',
      mapping: {
        properties: {
          id: { type: 'keyword' },
          title: { type: 'text', analyzer: 'standard' },
          content: { type: 'text', analyzer: 'standard' },
          description: { type: 'text', analyzer: 'standard' },
          tags: { type: 'keyword' },
          category: { type: 'keyword' },
          author: { type: 'keyword' },
          createdAt: { type: 'date' },
          updatedAt: { type: 'date' },
          isPublished: { type: 'boolean' }
        }
      }
    }
  ];

  for (const indexConfig of indices) {
    try {
      const exists = await elasticsearchClient.indices.exists({
        index: indexConfig.index
      });

      if (!exists) {
        await elasticsearchClient.indices.create({
          index: indexConfig.index,
          mappings: indexConfig.mapping as any
        });
        console.log(`✅ Índice '${indexConfig.index}' creado exitosamente`);
      }
    } catch (error) {
      console.error(`❌ Error creando índice '${indexConfig.index}':`, error);
    }
  }
};

/**
 * Cerrar conexión de Elasticsearch
 */
export const closeElasticsearch = async (): Promise<void> => {
  if (elasticsearchClient) {
    await elasticsearchClient.close();
    elasticsearchClient = null;
    isElasticsearchAvailable = false;
    console.log('🔌 Conexión de Elasticsearch cerrada');
  }
};

export default {
  initialize: initializeElasticsearch,
  getClient: getElasticsearchClient,
  isConnected: isElasticsearchConnected,
  close: closeElasticsearch
};
