import { NextResponse } from 'next/server'
import { requireAuthUser } from '@/lib/auth/session'
import { handleApiError } from '@/lib/api/error-handler'
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

    return NextResponse.json({
      team: {
        id: membership.team.id,
        name: membership.team.name,
        description: membership.team.description,
        inviteCode: membership.team.inviteCode,
        creator: membership.team.creator,
        createdAt: membership.team.createdAt,
        updatedAt: membership.team.updatedAt,
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
