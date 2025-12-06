import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthUser } from '@/lib/auth/session'
import { handleApiError } from '@/lib/api/error-handler'
import {
  isTeamMember,
  isTeamCreator,
  getTeamMemberCount,
} from '@/lib/utils/team'

/**
 * POST /api/teams/:id/leave
 * Salir de un equipo
 */
export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAuthUser()
    const params = await context.params
    const teamId = params.id

    // Verificar que el equipo existe
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true, creatorId: true },
    })

    if (!team) {
      return NextResponse.json(
        { error: 'Equipo no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que el usuario es miembro del equipo
    if (!(await isTeamMember(teamId, currentUser.id))) {
      return NextResponse.json(
        {
          error: 'No eres miembro de este equipo',
          details: ['No puedes salir de un equipo del cual no eres miembro.'],
        },
        { status: 400 }
      )
    }

    const isCreator = await isTeamCreator(teamId, currentUser.id)
    const memberCount = await getTeamMemberCount(teamId)

    // Si es el creador y hay otros miembros, transferir ownership al primer miembro
    if (isCreator && memberCount > 1) {
      // Buscar otro miembro para transferir el ownership
      const otherMember = await prisma.teamMember.findFirst({
        where: {
          teamId,
          userId: {
            not: currentUser.id,
          },
        },
        orderBy: {
          joinedAt: 'asc', // El más antiguo
        },
      })

      if (otherMember) {
        // Transferir ownership y salir en una transacción
        await prisma.$transaction(async (tx) => {
          // Actualizar creador del equipo
          await tx.team.update({
            where: { id: teamId },
            data: {
              creatorId: otherMember.userId,
            },
          })

          // Promover al nuevo creador a ADMIN
          await tx.teamMember.update({
            where: { id: otherMember.id },
            data: {
              role: 'ADMIN',
            },
          })

          // Eliminar membresía del usuario actual
          await tx.teamMember.delete({
            where: {
              userId_teamId: {
                userId: currentUser.id,
                teamId,
              },
            },
          })
        })

        return NextResponse.json({
          message:
            'Has salido del equipo. El ownership fue transferido a otro miembro.',
          ownershipTransferred: true,
        })
      }
    }

    // Si es el creador y es el único miembro, o si no es creador, solo salir
    await prisma.teamMember.delete({
      where: {
        userId_teamId: {
          userId: currentUser.id,
          teamId,
        },
      },
    })

    // Si era el único miembro, eliminar el equipo también
    if (isCreator && memberCount === 1) {
      await prisma.team.delete({
        where: { id: teamId },
      })

      return NextResponse.json({
        message:
          'Has salido del equipo. El equipo fue eliminado porque eras el único miembro.',
        teamDeleted: true,
      })
    }

    return NextResponse.json({
      message: 'Has salido del equipo exitosamente',
    })
  } catch (error) {
    return handleApiError(error)
  }
}
