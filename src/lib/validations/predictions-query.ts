import { z } from 'zod'

/**
 * Schema para validar query params de GET /api/predictions/me
 */
export const predictionsMeQuerySchema = z.object({
  // Filtros
  phaseId: z.string().uuid().optional(),
  phaseSlug: z.string().optional(),
  result: z.enum(['correct', 'incorrect', 'exact']).optional(), // correct = puntos > 0, exact = resultado exacto

  // Ordenamiento
  orderBy: z.enum(['date', 'points', 'created']).default('date'),
  order: z.enum(['asc', 'desc']).default('desc'),

  // Paginación
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

export type PredictionsMeQuery = z.infer<typeof predictionsMeQuerySchema>
