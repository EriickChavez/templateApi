import { Router } from 'express';
import { SearchController } from '../controllers/SearchController';
import { sanitizationPresets } from '../middlewares/advancedSanitization';

const router = Router();
const searchController = new SearchController();

/**
 * @swagger
 * /search/content:
 *   get:
 *     summary: Búsqueda de contenido con full-text search
 *     tags: [Búsqueda]
 *     parameters:
 *       - name: query
 *         in: query
 *         required: true
 *         description: Término de búsqueda
 *         schema:
 *           type: string
 *           example: "javascript tutorial"
 *       - name: filters
 *         in: query
 *         required: false
 *         description: Filtros en formato JSON
 *         schema:
 *           type: string
 *           example: '{"category":"programming","isPublished":true}'
 *       - name: sort
 *         in: query
 *         required: false
 *         description: Campo por el cual ordenar
 *         schema:
 *           type: string
 *           example: "createdAt"
 *     responses:
 *       200:
 *         description: Resultados de búsqueda
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       content:
 *                         type: string
 *                       tags:
 *                         type: array
 *                         items:
 *                           type: string
 *                       category:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                 message:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         description: Error interno del servidor
 */
router.get('/content', sanitizationPresets.search, searchController.searchContent);

/**
 * @swagger
 * /search/users:
 *   get:
 *     summary: Búsqueda de usuarios
 *     tags: [Búsqueda]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: query
 *         in: query
 *         required: true
 *         description: Término de búsqueda
 *         schema:
 *           type: string
 *           example: "juan"
 *       - name: filters
 *         in: query
 *         required: false
 *         description: Filtros en formato JSON
 *         schema:
 *           type: string
 *           example: '{"role":"User","status":"ACTIVE"}'
 *       - name: sort
 *         in: query
 *         required: false
 *         description: Campo por el cual ordenar
 *         schema:
 *           type: string
 *           example: "createdAt"
 *     responses:
 *       200:
 *         description: Resultados de búsqueda de usuarios
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 message:
 *                   type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         description: Error interno del servidor
 */
router.get('/users', sanitizationPresets.search, searchController.searchUsers);

/**
 * @swagger
 * /search/suggest:
 *   get:
 *     summary: Sugerencias de búsqueda
 *     tags: [Búsqueda]
 *     parameters:
 *       - name: q
 *         in: query
 *         required: true
 *         description: Término parcial para sugerencias
 *         schema:
 *           type: string
 *           example: "java"
 *       - name: type
 *         in: query
 *         required: false
 *         description: Tipo de sugerencia
 *         schema:
 *           type: string
 *           enum: [content, users, tags]
 *           example: "content"
 *     responses:
 *       200:
 *         description: Sugerencias de búsqueda
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: string
 *                 message:
 *                   type: string
 */
router.get('/suggest', (req, res) => {
  // Implementación básica de sugerencias
  const { q, type = 'content' } = req.query;
  
  // Aquí podrías implementar sugerencias reales basadas en tu dataset
  const suggestions = [
    `${q}script`,
    `${q}va tutorial`,
    `${q}va framework`
  ].filter(suggestion => suggestion.length > (q as string).length);

  res.json({
    success: true,
    data: suggestions,
    message: 'Sugerencias obtenidas exitosamente'
  });
});

/**
 * @swagger
 * /search/facets:
 *   get:
 *     summary: Obtener facetas para filtrado avanzado
 *     tags: [Búsqueda]
 *     parameters:
 *       - name: index
 *         in: query
 *         required: true
 *         description: Índice para obtener facetas
 *         schema:
 *           type: string
 *           enum: [content, users]
 *           example: "content"
 *     responses:
 *       200:
 *         description: Facetas disponibles para filtrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     categories:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           value:
 *                             type: string
 *                           count:
 *                             type: number
 *                     tags:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           value:
 *                             type: string
 *                           count:
 *                             type: number
 */
router.get('/facets', (req, res) => {
  const { index } = req.query;
  
  // Implementación básica de facetas
  const facets: Record<string, any> = {
    content: {
      categories: [
        { value: 'programming', count: 150 },
        { value: 'design', count: 89 },
        { value: 'marketing', count: 45 }
      ],
      tags: [
        { value: 'javascript', count: 120 },
        { value: 'react', count: 95 },
        { value: 'nodejs', count: 78 }
      ]
    },
    users: {
      roles: [
        { value: 'User', count: 1250 },
        { value: 'Admin', count: 5 },
        { value: 'Moderator', count: 15 }
      ],
      status: [
        { value: 'ACTIVE', count: 1200 },
        { value: 'INACTIVE', count: 70 }
      ]
    }
  };

  res.json({
    success: true,
    data: facets[index as string] || {},
    message: 'Facetas obtenidas exitosamente'
  });
});

export default router;
