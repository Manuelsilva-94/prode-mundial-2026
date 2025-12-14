import { prisma } from '@/lib/db'
import { Prisma, MatchStatus } from '@prisma/client'

interface MatchQueryOptions {
  userId?: string
  phase?: string
  team?: string
  status?: MatchStatus
  dateFrom?: Date
  dateTo?: Date
  page?: number
  limit?: number
}

/**
 * Obtiene partidos con filtros y paginación
 */
export async function getMatches(options: MatchQueryOptions) {
  const {
    userId,
    phase,
    team,
    status,
    dateFrom,
    dateTo,
    page = 1,
    limit = 20,
  } = options

  // Construir where clause dinámicamente
  const where: Prisma.MatchWhereInput = {}

  if (phase) {
    where.phaseId = phase
  }

  if (team) {
    where.OR = [{ homeTeamId: team }, { awayTeamId: team }]
  }

  if (status) {
    where.status = status
  }

  if (dateFrom || dateTo) {
    where.matchDate = {}
    if (dateFrom) where.matchDate.gte = dateFrom
    if (dateTo) where.matchDate.lte = dateTo
  }

  // Calcular offset
  const skip = (page - 1) * limit

  // Query paralela para count y datos
  const [matches, total] = await Promise.all([
    prisma.match.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        matchDate: 'asc',
      },
      include: {
        homeTeam: {
          select: {
            id: true,
            name: true,
            code: true,
            flagUrl: true,
          },
        },
        awayTeam: {
          select: {
            id: true,
            name: true,
            code: true,
            flagUrl: true,
          },
        },
        phase: {
          select: {
            id: true,
            name: true,
            slug: true,
            pointsMultiplier: true,
          },
        },
        // Incluir predicción del usuario si está autenticado
        // Usamos take: 1 porque hay un unique constraint en userId+matchId
        ...(userId && {
          predictions: {
            where: {
              userId,
            },
            take: 1,
            select: {
              id: true,
              predictedHomeScore: true,
              predictedAwayScore: true,
              pointsEarned: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        }),
      },
    }),
    prisma.match.count({ where }),
  ])

  return {
    matches,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: skip + limit < total,
      hasPreviousPage: page > 1,
      hasMore: skip + limit < total, // Mantener compatibilidad
    },
  }
}

/**
 * Obtiene un partido por ID con predicción del usuario
 */
export async function getMatchById(matchId: string, userId?: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      homeTeam: {
        select: {
          id: true,
          name: true,
          fullName: true,
          code: true,
          flagUrl: true,
        },
      },
      awayTeam: {
        select: {
          id: true,
          name: true,
          fullName: true,
          code: true,
          flagUrl: true,
        },
      },
      phase: {
        select: {
          id: true,
          name: true,
          slug: true,
          pointsMultiplier: true,
        },
      },
      ...(userId && {
        predictions: {
          where: { userId },
          select: {
            id: true,
            predictedHomeScore: true,
            predictedAwayScore: true,
            pointsEarned: true,
            pointsBreakdown: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      }),
    },
  })

  return match
}

/**
 * Obtiene partidos de hoy
 */
export async function getTodayMatches(userId?: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  return getMatches({
    userId,
    dateFrom: today,
    dateTo: tomorrow,
    limit: 50,
  })
}

/**
 * Obtiene próximos partidos (no finalizados)
 */
export async function getUpcomingMatches(userId?: string, limit = 20) {
  return getMatches({
    userId,
    status: 'SCHEDULED',
    dateFrom: new Date(),
    limit,
  })
}
