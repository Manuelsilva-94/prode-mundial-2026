import { z } from 'zod'
import { prisma } from '@/lib/db'

// Custom validator for datetime-local input format (YYYY-MM-DDTHH:mm)
const dateTimeLocalString = z.string().refine(
  (val) => {
    if (!val) return false
    const date = new Date(val)
    return !isNaN(date.getTime())
  },
  { message: 'Fecha y hora inválida' }
)

export const createMatchSchema = z.object({
  homeTeamId: z.string().uuid('Selecciona el equipo local'),
  awayTeamId: z.string().uuid('Selecciona el equipo visitante'),
  matchDate: dateTimeLocalString,
  stadium: z.string().min(1, 'El estadio es requerido').max(200),
  city: z.string().min(1, 'La ciudad es requerida').max(100),
  country: z.string().min(1, 'El país es requerido').max(100),
  phaseId: z.string().uuid('Selecciona la fase'),
  groupLetter: z.string().max(1).optional().nullable(),
}).refine((data) => data.homeTeamId !== data.awayTeamId, {
  message: 'Los equipos no pueden ser iguales',
  path: ['awayTeamId'],
})

export const updateMatchSchema = z.object({
  homeTeamId: z.string().uuid().optional(),
  awayTeamId: z.string().uuid().optional(),
  matchDate: dateTimeLocalString.optional(),
  stadium: z.string().min(1).max(200).optional(),
  city: z.string().min(1).max(100).optional(),
  country: z.string().min(1).max(100).optional(),
  phaseId: z.string().uuid().optional(),
  groupLetter: z.string().max(1).optional().nullable(),
  homeScore: z.number().int().min(0).optional().nullable(),
  awayScore: z.number().int().min(0).optional().nullable(),
  status: z.enum(['SCHEDULED', 'LIVE', 'FINISHED', 'POSTPONED']).optional(),
}).refine((data) => {
  if (data.homeTeamId && data.awayTeamId) {
    return data.homeTeamId !== data.awayTeamId
  }
  return true
}, {
  message: 'Los equipos no pueden ser iguales',
  path: ['awayTeamId'],
})

export const matchQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  phaseId: z.string().uuid().optional(),
  status: z.enum(['SCHEDULED', 'LIVE', 'FINISHED', 'POSTPONED']).optional(),
  search: z.string().optional(),
  orderBy: z.enum(['date', 'status', 'phase']).default('date'),
  order: z.enum(['asc', 'desc']).default('asc'),
})

// Schema para filtros públicos de partidos
export const matchFiltersSchema = z.object({
  phase: z.string().uuid().optional(),
  team: z.string().uuid().optional(),
  status: z.enum(['SCHEDULED', 'LIVE', 'FINISHED', 'POSTPONED']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
})

// Schema para actualizar resultado de partido
export const updateMatchResultSchema = z.object({
  homeScore: z.number().int().min(0, 'El score no puede ser negativo'),
  awayScore: z.number().int().min(0, 'El score no puede ser negativo'),
})

// Función de validación para actualizar resultado
export async function validateMatchResultUpdate(matchId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: {
      id: true,
      status: true,
      homeScore: true,
      awayScore: true,
      matchDate: true,
      homeTeam: { select: { name: true } },
      awayTeam: { select: { name: true } },
    },
  })

  const errors: string[] = []

  if (!match) {
    return { isValid: false, errors: ['Partido no encontrado'], match: null }
  }

  // Validar que el partido no esté ya finalizado (a menos que sea corrección)
  // Por ahora permitimos actualizar partidos finalizados para correcciones

  // Validar que la fecha del partido ya haya pasado o esté en curso
  const now = new Date()
  if (new Date(match.matchDate) > now) {
    errors.push('No se puede cargar resultado de un partido que aún no comenzó')
  }

  return {
    isValid: errors.length === 0,
    errors,
    match,
  }
}

export type CreateMatchInput = z.infer<typeof createMatchSchema>
export type UpdateMatchInput = z.infer<typeof updateMatchSchema>
export type MatchQueryInput = z.infer<typeof matchQuerySchema>
export type MatchFiltersInput = z.infer<typeof matchFiltersSchema>
export type UpdateMatchResultInput = z.infer<typeof updateMatchResultSchema>
