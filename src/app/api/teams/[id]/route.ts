import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthUser } from '@/lib/auth/session'
import { handleApiError } from '@/lib/api/error-handler'
import { updateTeamSchema } from '@/lib/validations/team'
import { isTeamCreator, getTeamMembersWithStats } from '@/lib/utils/team'

/**
 * GET /api/teams/:id
 * Obtener detalle de un equipo
 */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const teamId = params.id

    const team = await prisma.team.findUnique({
      where: { id: teamId },
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
        { error: 'Equipo no encontrado' },
        { status: 404 }
      )
    }

    // Obtener miembros con estadísticas
    const members = await getTeamMembersWithStats(teamId)

    return NextResponse.json({
      id: team.id,
      name: team.name,
      description: team.description,
      inviteCode: team.inviteCode,
      creator: team.creator,
      memberCount: team._count.members,
      members,
      createdAt: team.createdAt,
      updatedAt: team.updatedAt,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PATCH /api/teams/:id
 * Actualizar un equipo (solo creador)
 */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAuthUser()
    const params = await context.params
    const teamId = params.id

    // Verificar que el equipo existe
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { creatorId: true, name: true },
    })

    if (!team) {
      return NextResponse.json(
        { error: 'Equipo no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que el usuario es el creador
    if (!(await isTeamCreator(teamId, currentUser.id))) {
      return NextResponse.json(
        {
          error: 'No autorizado',
          details: ['Solo el creador del equipo puede editarlo.'],
        },
        { status: 403 }
      )
    }

    const body = await req.json()
    const validatedData = updateTeamSchema.parse(body)

    // Si se actualiza el nombre, validar que no esté duplicado
    if (validatedData.name && validatedData.name !== team.name) {
      const existingTeamName = await prisma.team.findFirst({
        where: {
          name: {
            equals: validatedData.name,
            mode: 'insensitive',
          },
          NOT: {
            id: teamId,
          },
        },
      })

      if (existingTeamName) {
        return NextResponse.json(
          {
            error: 'Nombre de equipo no disponible',
            details: [
              'Ya existe un equipo con ese nombre. Por favor, elige otro.',
            ],
          },
          { status: 409 }
        )
      }
    }

    // Actualizar equipo
    const updatedTeam = await prisma.team.update({
      where: { id: teamId },
      data: {
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.description !== undefined && {
          description: validatedData.description,
        }),
      },
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

    return NextResponse.json({
      message: 'Equipo actualizado exitosamente',
      data: updatedTeam,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/teams/:id
 * Eliminar un equipo (solo creador)
 */
export async function DELETE(
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
      select: { creatorId: true },
    })

    if (!team) {
      return NextResponse.json(
        { error: 'Equipo no encontrado' },
        { status: 404 }
      )
    }

    // Verificar que el usuario es el creador
    if (!(await isTeamCreator(teamId, currentUser.id))) {
      return NextResponse.json(
        {
          error: 'No autorizado',
          details: ['Solo el creador del equipo puede eliminarlo.'],
        },
        { status: 403 }
      )
    }

    // Eliminar equipo (los miembros se eliminan en cascada por el schema)
    await prisma.team.delete({
      where: { id: teamId },
    })

    return NextResponse.json({
      message: 'Equipo eliminado exitosamente',
    })
  } catch (error) {
    return handleApiError(error)
  }
}
