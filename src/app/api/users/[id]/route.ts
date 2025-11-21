import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { handleApiError } from '@/lib/api/error-handler'

export async function GET(
  _request: NextRequest, // ← Agregar underscore para indicar que no se usa
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticación
    await requireAuth()

    const params = await context.params
    const userId = params.id.trim().toLowerCase()

    // Validar UUID
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(userId)) {
      return NextResponse.json(
        { error: 'ID de usuario inválido' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    const stats = await prisma.prediction.aggregate({
      where: { userId },
      _count: { id: true },
      _sum: { pointsEarned: true },
    })

    const leaderboard = await prisma.leaderboardCache.findUnique({
      where: { userId },
      select: {
        totalPoints: true,
        totalPredictions: true,
        correctPredictions: true,
        exactScores: true,
        ranking: true,
        accuracyRate: true,
      },
    })

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        avatarUrl: user.avatarUrl,
        memberSince: user.createdAt,
      },
      stats: leaderboard || {
        totalPoints: stats._sum.pointsEarned || 0,
        totalPredictions: stats._count.id || 0,
        correctPredictions: 0,
        exactScores: 0,
        ranking: 0,
        accuracyRate: 0,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
