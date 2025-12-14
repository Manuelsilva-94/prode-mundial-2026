import { NextResponse } from 'next/server'
import { requireAuthUser } from '@/lib/auth/session'
import { handleApiError } from '@/lib/api/error-handler'
import { prisma } from '@/lib/db'
import { getUserTeam, getTeamMembersWithStats } from '@/lib/utils/team'

/**
 * GET /api/teams/me
 * Obtener el equipo del usuario autenticado
 */
export async function GET() {
  try {
    const currentUser = await requireAuthUser()

    const membership = await getUserTeam(currentUser.id)

    if (!membership) {
      return NextResponse.json({
        team: null,
        membership: null,
      })
    }

    // Obtener miembros con estadísticas
    const members = await getTeamMembersWithStats(membership.teamId)

    // Calcular el ranking del equipo (por promedio de puntos)
    const teamRanking = await calculateTeamRanking(membership.teamId)

    return NextResponse.json({
      team: {
        id: membership.team.id,
        name: membership.team.name,
        description: membership.team.description,
        inviteCode: membership.team.inviteCode,
        creator: membership.team.creator,
        createdAt: membership.team.createdAt,
        updatedAt: membership.team.updatedAt,
        ranking: teamRanking.ranking,
        totalTeams: teamRanking.totalTeams,
        averagePoints: teamRanking.averagePoints,
      },
      membership: {
        id: membership.id,
        role: membership.role,
        joinedAt: membership.joinedAt,
        isCreator: membership.team.creatorId === currentUser.id,
      },
      members,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * Calcula el ranking de un equipo basado en promedio de puntos
 */
async function calculateTeamRanking(teamId: string): Promise<{
  ranking: number
  totalTeams: number
  averagePoints: number
}> {
  // Obtener todos los equipos con sus miembros
  const teams = await prisma.team.findMany({
    include: {
      members: {
        select: {
          userId: true,
        },
      },
    },
  })

  // Calcular promedio de puntos para cada equipo
  const teamsWithAverage = await Promise.all(
    teams.map(async (team) => {
      const memberIds = team.members.map((m) => m.userId)

      if (memberIds.length === 0) {
        return { id: team.id, averagePoints: 0 }
      }

      const stats = await prisma.leaderboardCache.findMany({
        where: { userId: { in: memberIds } },
        select: { totalPoints: true },
      })

      const totalPoints = stats.reduce((sum, s) => sum + s.totalPoints, 0)
      const averagePoints = Math.round(totalPoints / memberIds.length)

      return { id: team.id, averagePoints, totalPoints }
    })
  )

  // Ordenar por promedio (descendente)
  const sorted = teamsWithAverage.sort((a, b) => {
    if (b.averagePoints !== a.averagePoints) {
      return b.averagePoints - a.averagePoints
    }
    // Desempate por puntos totales
    return (b.totalPoints || 0) - (a.totalPoints || 0)
  })

  // Encontrar posición del equipo
  const position = sorted.findIndex((t) => t.id === teamId)
  const currentTeam = sorted.find((t) => t.id === teamId)

  return {
    ranking: position + 1,
    totalTeams: teams.length,
    averagePoints: currentTeam?.averagePoints || 0,
  }
}
