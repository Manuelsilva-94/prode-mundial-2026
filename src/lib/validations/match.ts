import { z } from 'zod'

export const matchFiltersSchema = z.object({
  phase: z.string().optional(),
  team: z.string().optional(), // ID del equipo
  status: z.enum(['SCHEDULED', 'LIVE', 'FINISHED', 'POSTPONED']).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
})

export type MatchFilters = z.infer<typeof matchFiltersSchema>
