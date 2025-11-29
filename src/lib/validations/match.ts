// lib/validations/match.ts
import { z } from 'zod'
import { prisma } from '@/lib/db'

// ==========================================
// SCHEMAS PARA FILTROS Y QUERIES
// ==========================================

export const matchFiltersSchema = z.object({
  phase: z.string().optional(),
  team: z.string().optional(),
  status: z.enum(['SCHEDULED', 'LIVE', 'FINISHED', 'POSTPONED']).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
})

export type MatchFilters = z.infer<typeof matchFiltersSchema>

export const adminMatchFiltersSchema = matchFiltersSchema.extend({
  search: z.string().optional(),
  sortBy: z.enum(['matchDate', 'createdAt', 'updatedAt']).default('matchDate'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
})

export type AdminMatchFilters = z.infer<typeof adminMatchFiltersSchema>

// ==========================================
// SCHEMAS PARA CREAR Y ACTUALIZAR
// ==========================================

export const createMatchSchema = z
  .object({
    homeTeamId: z.string().uuid('ID de equipo local inválido'),
    awayTeamId: z.string().uuid('ID de equipo visitante inválido'),
    phaseId: z.string().uuid('ID de fase inválido'),
    matchDate: z.string().datetime('Fecha inválida'),
    stadium: z.string().min(1, 'Estadio es requerido'),
    city: z.string().min(1, 'Ciudad es requerida'),
    country: z.string().min(1, 'País es requerido'),
    groupLetter: z.string().length(1).optional().nullable(),
  })
  .refine((data) => data.homeTeamId !== data.awayTeamId, {
    message: 'El equipo local y visitante no pueden ser el mismo',
    path: ['awayTeamId'],
  })

export type CreateMatchInput = z.infer<typeof createMatchSchema>

export const updateMatchSchema = z
  .object({
    homeTeamId: z.string().uuid().optional(),
    awayTeamId: z.string().uuid().optional(),
    phaseId: z.string().uuid().optional(),
    matchDate: z.string().datetime().optional(),
    stadium: z.string().min(1).optional(),
    city: z.string().min(1).optional(),
    country: z.string().min(1).optional(),
    groupLetter: z.string().length(1).optional().nullable(),
    status: z.enum(['SCHEDULED', 'LIVE', 'FINISHED', 'POSTPONED']).optional(),
    homeScore: z.number().int().min(0).optional().nullable(),
    awayScore: z.number().int().min(0).optional().nullable(),
  })
  .refine(
    (data) => {
      if (
        data.homeTeamId &&
        data.awayTeamId &&
        data.homeTeamId === data.awayTeamId
      ) {
        return false
      }
      return true
    },
    {
      message: 'El equipo local y visitante no pueden ser el mismo',
      path: ['awayTeamId'],
    }
  )

export type UpdateMatchInput = z.infer<typeof updateMatchSchema>

// ==========================================
// FUNCIONES HELPER
// ==========================================

/**
 * Calcula el lockTime automáticamente (15 minutos antes del partido)
 */
export function calculateLockTime(matchDate: Date): Date {
  const lockTime = new Date(matchDate)
  lockTime.setMinutes(lockTime.getMinutes() - 15)
  return lockTime
}

/**
 * Determina si un partido ya está bloqueado
 */
export function isMatchLocked(lockTime: Date): boolean {
  return new Date() >= lockTime
}

// ==========================================
// VALIDACIONES DE NEGOCIO
// ==========================================

/**
 * Valida que se pueda crear un partido
 */
export async function validateMatchCreation(data: CreateMatchInput) {
  const errors: string[] = []

  // Validar que la fecha sea futura
  const matchDate = new Date(data.matchDate)
  if (matchDate <= new Date()) {
    errors.push('La fecha del partido debe ser en el futuro')
  }

  // Validar que los equipos existan
  const [homeTeam, awayTeam] = await Promise.all([
    prisma.footballTeam.findUnique({ where: { id: data.homeTeamId } }),
    prisma.footballTeam.findUnique({ where: { id: data.awayTeamId } }),
  ])

  if (!homeTeam) {
    errors.push(`Equipo local con ID ${data.homeTeamId} no existe`)
  }
  if (!awayTeam) {
    errors.push(`Equipo visitante con ID ${data.awayTeamId} no existe`)
  }

  // Validar que la fase exista
  const phase = await prisma.tournamentPhase.findUnique({
    where: { id: data.phaseId },
  })
  if (!phase) {
    errors.push(`Fase con ID ${data.phaseId} no existe`)
  }

  // Validar que no exista ya un partido similar
  const existingMatch = await prisma.match.findFirst({
    where: {
      OR: [
        {
          homeTeamId: data.homeTeamId,
          awayTeamId: data.awayTeamId,
        },
        {
          homeTeamId: data.awayTeamId,
          awayTeamId: data.homeTeamId,
        },
      ],
      matchDate: {
        gte: new Date(matchDate.getTime() - 24 * 60 * 60 * 1000), // -24h
        lte: new Date(matchDate.getTime() + 24 * 60 * 60 * 1000), // +24h
      },
    },
  })

  if (existingMatch) {
    errors.push('Ya existe un partido entre estos equipos en una fecha similar')
  }

  return errors
}

/**
 * Valida que se pueda actualizar un partido
 */
export async function validateMatchUpdate(
  matchId: string,
  data: UpdateMatchInput
) {
  const errors: string[] = []

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      predictions: true,
    },
  })

  if (!match) {
    errors.push('Partido no encontrado')
    return errors
  }

  // No editar partidos finalizados
  if (match.status === 'FINISHED') {
    errors.push('No se puede editar un partido finalizado')
  }

  // No cambiar equipos si hay predicciones
  if (match.predictions.length > 0) {
    if (data.homeTeamId && data.homeTeamId !== match.homeTeamId) {
      errors.push(
        'No se puede cambiar el equipo local porque ya hay predicciones'
      )
    }
    if (data.awayTeamId && data.awayTeamId !== match.awayTeamId) {
      errors.push(
        'No se puede cambiar el equipo visitante porque ya hay predicciones'
      )
    }
  }

  // Validar que los equipos existan si se están actualizando
  if (data.homeTeamId) {
    const homeTeam = await prisma.footballTeam.findUnique({
      where: { id: data.homeTeamId },
    })
    if (!homeTeam) {
      errors.push(`Equipo local con ID ${data.homeTeamId} no existe`)
    }
  }

  if (data.awayTeamId) {
    const awayTeam = await prisma.footballTeam.findUnique({
      where: { id: data.awayTeamId },
    })
    if (!awayTeam) {
      errors.push(`Equipo visitante con ID ${data.awayTeamId} no existe`)
    }
  }

  // Validar que la fase exista si se está actualizando
  if (data.phaseId) {
    const phase = await prisma.tournamentPhase.findUnique({
      where: { id: data.phaseId },
    })
    if (!phase) {
      errors.push(`Fase con ID ${data.phaseId} no existe`)
    }
  }

  return errors
}

/**
 * Valida que se pueda eliminar un partido
 */
export async function validateMatchDeletion(matchId: string) {
  const errors: string[] = []

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      _count: {
        select: {
          predictions: true,
        },
      },
    },
  })

  if (!match) {
    errors.push('Partido no encontrado')
    return errors
  }

  // Advertir si hay predicciones
  if (match._count.predictions > 0) {
    errors.push(
      `El partido tiene ${match._count.predictions} predicción(es). La eliminación eliminará también todas las predicciones asociadas.`
    )
  }

  return errors
}
