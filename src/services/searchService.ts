import { default as Fuse, IFuseOptions } from 'fuse.js';
import { getElasticsearchClient, isElasticsearchConnected } from '../config/elasticsearch';

/**
 * Opciones de configuración para Fuse.js
 */
const fuseOptions: IFuseOptions<any> = {
  includeScore: true,
  threshold: 0.3,
  keys: ['title', 'content', 'tags']
};

/**
 * Realiza una búsqueda en ElasticSearch
 */
export const searchWithElasticsearch = async (
  index: string, 
  query: string,
  filters: Record<string, any> = {},
  sort: string | null = null
): Promise<any[]> => {
  if (!isElasticsearchConnected()) {
    return [];
  }

  const esClient = getElasticsearchClient();
  if (!esClient) {
    throw new Error('Cliente de Elasticsearch no disponible');
  }

  const mustQueries = [
    {
      multi_match: {
        query,
        fields: ['title^2', 'content', 'tags']
      }
    }
  ];

  const filterQueries = Object.entries(filters).map(([field, value]) => ({
    term: { [field]: value }
  }));

  try {
    const searchBody: any = {
      query: {
        bool: {
          must: mustQueries,
          filter: filterQueries
        }
      }
    };

    if (sort) {
      searchBody.sort = [{ [sort]: { order: 'asc' } }];
    }

    const response = await esClient.search({
      index,
      body: searchBody
    });

    return response.hits.hits.map((hit: any) => hit._source);
  } catch (error) {
    console.error('Error en Elasticsearch:', error);
    return [];
  }
};

/**
 * Realiza una búsqueda en memoria con Fuse.js
 */
export const searchWithFuse = (
  dataSet: any[],
  query: string,
  filters: Record<string, any> = {},
  sort: string | null = null
): any[] => {
  const fuse = new Fuse(dataSet, fuseOptions);
  const results = fuse.search(query);

  let filteredResults = results.filter(result => {
    return Object.entries(filters).every(([key, value]) => result.item[key] === value);
  }).map(result => result.item);

  if (sort) {
    filteredResults = filteredResults.sort((a, b) => a[sort] > b[sort] ? 1 : -1);
  }

  return filteredResults;
};

export default {
  searchWithElasticsearch,
  searchWithFuse
};

