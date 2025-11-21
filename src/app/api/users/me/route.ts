import { NextRequest, NextResponse } from 'next/server'
import { requireAuthUser } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { updateProfileSchema } from '@/lib/validations/user'
import { handleApiError } from '@/lib/api/error-handler'

export async function GET() {
  try {
    // Usar helper requireAuthUser
    const currentUser = await requireAuthUser()

    // Obtener estadísticas del usuario
    const stats = await prisma.prediction.aggregate({
      where: { userId: currentUser.id },
      _count: { id: true },
      _sum: { pointsEarned: true },
    })

    // Obtener equipos del usuario
    const teams = await prisma.teamMember.findMany({
      where: { userId: currentUser.id },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            inviteCode: true,
          },
        },
      },
    })

    return NextResponse.json({
      user: {
        id: currentUser.id,
        email: currentUser.email,
        name: currentUser.name,
        avatarUrl: currentUser.avatarUrl,
        role: currentUser.role,
        emailVerified: currentUser.emailVerified,
        createdAt: currentUser.createdAt,
      },
      stats: {
        totalPredictions: stats._count.id || 0,
        totalPoints: stats._sum.pointsEarned || 0,
      },
      teams: teams.map((tm) => tm.team),
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Usar helper requireAuthUser
    const currentUser = await requireAuthUser()

    const body = await request.json()
    const validatedData = updateProfileSchema.parse(body)

    if (!validatedData.name && validatedData.avatarUrl === undefined) {
      return NextResponse.json({ user: currentUser })
    }

    const updatedUser = await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        ...(validatedData.name && { name: validatedData.name }),
        ...(validatedData.avatarUrl !== undefined && {
          avatarUrl: validatedData.avatarUrl,
        }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({
      message: 'Perfil actualizado exitosamente',
      user: updatedUser,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
