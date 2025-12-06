import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthUser } from '@/lib/auth/session'
import { handleApiError } from '@/lib/api/error-handler'
import { joinTeamSchema } from '@/lib/validations/team'
import {
  getUserTeam,
  isTeamMember,
  isTeamFull,
  getTeamMembersWithStats,
} from '@/lib/utils/team'

/**
 * POST /api/teams/join
 * Unirse a un equipo usando el teamId
 */
export async function POST(req: NextRequest) {
  try {
    const currentUser = await requireAuthUser()
    const body = await req.json()
    const validatedData = joinTeamSchema.parse(body)

    // 1. Verificar que el equipo existe
    const team = await prisma.team.findUnique({
      where: { id: validatedData.teamId },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
    })

    if (!team) {
      return NextResponse.json(
        {
          error: 'Equipo no encontrado',
          details: ['El equipo especificado no existe.'],
        },
        { status: 404 }
      )
    }

    // 2. Verificar que el usuario no está ya en otro equipo
    const existingTeam = await getUserTeam(currentUser.id)
    if (existingTeam) {
      return NextResponse.json(
        {
          error: 'Ya estás en un equipo',
          details: [
            'Solo puedes estar en un equipo a la vez. Debes salir del equipo actual antes de unirte a otro.',
          ],
          currentTeam: {
            id: existingTeam.team.id,
            name: existingTeam.team.name,
          },
        },
        { status: 400 }
      )
    }

    // 3. Verificar que el usuario no está ya en este equipo
    if (await isTeamMember(validatedData.teamId, currentUser.id)) {
      return NextResponse.json(
        {
          error: 'Ya eres miembro de este equipo',
          details: ['No puedes unirte a un equipo del que ya eres miembro.'],
        },
        { status: 400 }
      )
    }

    // 4. Verificar si el equipo está lleno (límite opcional)
    if (await isTeamFull(validatedData.teamId)) {
      return NextResponse.json(
        {
          error: 'Equipo lleno',
          details: [
            'Este equipo ha alcanzado el límite máximo de miembros. No se pueden agregar más miembros.',
          ],
          memberCount: team._count.members,
        },
        { status: 400 }
      )
    }

    // 5. Agregar usuario al equipo
    await prisma.teamMember.create({
      data: {
        userId: currentUser.id,
        teamId: validatedData.teamId,
        role: 'MEMBER', // Nuevos miembros son MEMBER por defecto
      },
    })

    // 6. Obtener información completa del equipo con miembros
    const teamWithMembers = await prisma.team.findUnique({
      where: { id: validatedData.teamId },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    })

    if (!teamWithMembers) {
      throw new Error('Error al obtener información del equipo')
    }

    // Obtener miembros con estadísticas
    const members = await getTeamMembersWithStats(validatedData.teamId)

    return NextResponse.json(
      {
        message: 'Te has unido al equipo exitosamente',
        team: {
          id: teamWithMembers.id,
          name: teamWithMembers.name,
          description: teamWithMembers.description,
          inviteCode: teamWithMembers.inviteCode,
          creator: teamWithMembers.creator,
          createdAt: teamWithMembers.createdAt,
          updatedAt: teamWithMembers.updatedAt,
        },
        membership: {
          role: 'MEMBER',
          joinedAt: new Date(),
        },
        members,
      },
      { status: 200 }
    )
  } catch (error) {
    return handleApiError(error)
  }
}

