import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { handleApiError } from '@/lib/api/error-handler'
import { z } from 'zod'

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  search: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    const { searchParams } = new URL(request.url)

    const params = querySchema.parse({
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 20,
      search: searchParams.get('search') || undefined,
    })

    const { page, limit, search } = params
    const skip = (page - 1) * limit

    // Construir filtro de búsqueda
    const whereClause = search
      ? {
          name: {
            contains: search,
            mode: 'insensitive' as const,
          },
        }
      : {}

    // Obtener todos los equipos con sus miembros y estadísticas
    const teams = await prisma.team.findMany({
      where: whereClause,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
    })

    // Calcular estadísticas para cada equipo
    const teamsWithStats = await Promise.all(
      teams.map(async (team) => {
        // Obtener los IDs de los miembros
        const memberIds = team.members.map((m) => m.userId)

        // Obtener estadísticas de los miembros desde leaderboardCache
        const memberStats = await prisma.leaderboardCache.findMany({
          where: {
            userId: { in: memberIds },
          },
          select: {
            userId: true,
            totalPoints: true,
            totalPredictions: true,
            correctPredictions: true,
            exactScores: true,
          },
        })

        // Calcular totales del equipo
        const totalPoints = memberStats.reduce(
          (sum, s) => sum + s.totalPoints,
          0
        )
        const totalPredictions = memberStats.reduce(
          (sum, s) => sum + s.totalPredictions,
          0
        )
        const correctPredictions = memberStats.reduce(
          (sum, s) => sum + s.correctPredictions,
          0
        )
        const exactScores = memberStats.reduce(
          (sum, s) => sum + s.exactScores,
          0
        )

        const memberCount = team._count.members
        const averagePoints =
          memberCount > 0 ? Math.round(totalPoints / memberCount) : 0

        return {
          id: team.id,
          name: team.name,
          description: team.description,
          inviteCode: team.inviteCode,
          createdAt: team.createdAt,
          creator: team.creator,
          memberCount,
          totalPoints,
          averagePoints,
          totalPredictions,
          correctPredictions,
          exactScores,
        }
      })
    )

    // Ordenar siempre por promedio de puntos (única métrica válida para equipos)
    const sortedTeams = teamsWithStats.sort((a, b) => {
      if (b.averagePoints !== a.averagePoints) {
        return b.averagePoints - a.averagePoints
      }
      // Desempate por puntos totales
      return b.totalPoints - a.totalPoints
    })

    // Asignar rankings
    const rankedTeams = sortedTeams.map((team, index) => ({
      ...team,
      ranking: index + 1,
    }))

    // Paginar
    const paginatedTeams = rankedTeams.slice(skip, skip + limit)
    const total = rankedTeams.length

    // Obtener el equipo del usuario actual
    let currentUserTeamData: { id: string; ranking: number } | null = null
    if (currentUser) {
      const userMembership = await prisma.teamMember.findFirst({
        where: { userId: currentUser.id },
        select: { teamId: true },
      })

      if (userMembership) {
        const foundTeam = rankedTeams.find(
          (t) => t.id === userMembership.teamId
        )
        if (foundTeam) {
          currentUserTeamData = {
            id: foundTeam.id,
            ranking: foundTeam.ranking,
          }
        }
      }
    }

    return NextResponse.json({
      teams: paginatedTeams,
      currentUserTeam: currentUserTeamData,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: skip + limit < total,
        hasPreviousPage: page > 1,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

