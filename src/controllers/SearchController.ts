import { Request, Response } from 'express';
import { searchWithElasticsearch, searchWithFuse } from '../services/searchService';
import { isElasticsearchConnected } from '../config/elasticsearch';

export class SearchController {
  /**
   * Búsqueda de contenido
   * Puede buscar en Elasticsearch o usar Fuse.js si Elasticsearch no está disponible
   */
  async searchContent(req: Request, res: Response): Promise<Response> {
    try {
      const { query, filters = {}, sort } = req.query;

      // Normalizar filtros
      const normalizedFilters = typeof filters === 'string' ? JSON.parse(filters) : filters;

      let results = [];

      if (isElasticsearchConnected()) {
        // Búsqueda en Elasticsearch
        results = await searchWithElasticsearch('content', query as string, normalizedFilters, sort?.toString());
      } else {
        // Simular un dataSet en memoria (deberías reemplazar con tu fuente real de datos)
        const dataSet: any[] = [];
        results = searchWithFuse(dataSet, query as string, normalizedFilters, sort?.toString());
      }

      return res.status(200).json({
        success: true,
        data: results,
        message: 'Búsqueda completada exitosamente'
      });
    } catch (error) {
      console.error('Error en la búsqueda de contenido:', error);
      return res.status(500).json({
        success: false,
        message: 'Error en la búsqueda de contenido',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }
  
  /**
   * Búsqueda de usuarios
   */
  async searchUsers(req: Request, res: Response): Promise<Response> {
    try {
      const { query, filters = {}, sort } = req.query;

      const normalizedFilters = typeof filters === 'string' ? JSON.parse(filters) : filters;

      let results = [];

      if (isElasticsearchConnected()) {
        results = await searchWithElasticsearch('users', query as string, normalizedFilters, sort?.toString());
      } else {
        const dataSet: any[] = [];
        results = searchWithFuse(dataSet, query as string, normalizedFilters, sort?.toString());
      }

      return res.status(200).json({
        success: true,
        data: results,
        message: 'Búsqueda de usuarios completada exitosamente'
      });
    } catch (error) {
      console.error('Error en la búsqueda de usuarios:', error);
      return res.status(500).json({
        success: false,
        message: 'Error en la búsqueda de usuarios',
        error: error instanceof Error ? error.message : 'Error desconocido'
      });
    }
  }
}

