import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthUser } from '@/lib/auth/session'
import { handleApiError } from '@/lib/api/error-handler'

export async function GET() {
  try {
    // Usuario autenticado
    const currentUser = await requireAuthUser()

    // Ranking y stats personales (idealmente siempre está en LeaderboardCache)
    const myLB = await prisma.leaderboardCache.findUnique({
      where: { userId: currentUser.id },
      include: {
        user: {
          select: { id: true, name: true, avatarUrl: true, createdAt: true },
        },
      },
    })

    // Cálculo de posición relativa y evolución
    let evolution: {
      ranking: number
      previousRanking: number | null
      rankingChange: number
    } | null = null
    if (myLB) {
      evolution = {
        ranking: myLB.ranking,
        previousRanking: myLB.previousRanking,
        rankingChange: myLB.rankingChange,
      }
    }

    // Métricas agregadas para comparación
    const totalUsers = await prisma.leaderboardCache.count()
    const avgPointsRaw = await prisma.leaderboardCache.aggregate({
      _avg: {
        totalPoints: true,
        accuracyRate: true,
      },
    })

    return NextResponse.json({
      user: {
        id: currentUser.id,
        name: currentUser.name,
        avatarUrl: currentUser.avatarUrl,
        memberSince: currentUser.createdAt,
      },
      stats: myLB,
      evolution,
      comparison: {
        totalUsers,
        avgPoints: Math.round((avgPointsRaw._avg.totalPoints || 0) * 100) / 100,
        avgAccuracyRate: Math.round((Number(avgPointsRaw._avg.accuracyRate) || 0) * 100) / 100,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}


