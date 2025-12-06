import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthUser } from '@/lib/auth/session'
import { handleApiError } from '@/lib/api/error-handler'
import { createTeamSchema } from '@/lib/validations/team'
import { generateUniqueInviteCode, getUserTeam } from '@/lib/utils/team'

/**
 * POST /api/teams
 * Crear un nuevo equipo
 */
export async function POST(req: NextRequest) {
  try {
    const currentUser = await requireAuthUser()

    // Validar que el usuario no esté ya en un equipo
    const existingTeam = await getUserTeam(currentUser.id)
    if (existingTeam) {
      return NextResponse.json(
        {
          error: 'Ya estás en un equipo',
          details: [
            'Solo puedes estar en un equipo a la vez. Debes salir del equipo actual antes de crear uno nuevo.',
          ],
        },
        { status: 400 }
      )
    }

    const body = await req.json()
    const validatedData = createTeamSchema.parse(body)

    // Validar que el nombre no esté duplicado
    const existingTeamName = await prisma.team.findFirst({
      where: {
        name: {
          equals: validatedData.name,
          mode: 'insensitive',
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

    // Generar código de invitación único
    const inviteCode = await generateUniqueInviteCode()

    // Crear equipo y agregar creador como miembro en una transacción
    const team = await prisma.$transaction(async (tx) => {
      // Crear el equipo
      const newTeam = await tx.team.create({
        data: {
          name: validatedData.name,
          description: validatedData.description || null,
          inviteCode,
          creatorId: currentUser.id,
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
        },
      })

      // Agregar creador como miembro del equipo
      await tx.teamMember.create({
        data: {
          userId: currentUser.id,
          teamId: newTeam.id,
          role: 'ADMIN', // El creador es admin
        },
      })

      return newTeam
    })

    return NextResponse.json(
      {
        message: 'Equipo creado exitosamente',
        data: team,
      },
      { status: 201 }
    )
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * GET /api/teams
 * Listar todos los equipos
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = Number(searchParams.get('page')) || 1
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 50)
    const skip = (page - 1) * limit

    const [teams, total] = await Promise.all([
      prisma.team.findMany({
        skip,
        take: limit,
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
          _count: {
            select: {
              members: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.team.count(),
    ])

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      data: teams.map((team) => ({
        id: team.id,
        name: team.name,
        description: team.description,
        inviteCode: team.inviteCode,
        creator: team.creator,
        memberCount: team._count.members,
        createdAt: team.createdAt,
        updatedAt: team.updatedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
