import { NextResponse } from 'next/server'
import { requireAuthUser } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { handleApiError } from '@/lib/api/error-handler'

/**
 * GET /api/users/me/stats
 * Obtiene estadísticas completas del usuario autenticado
 */
export async function GET() {
  try {
    // Usuario autenticado
    const currentUser = await requireAuthUser()

    // Obtener datos del leaderboard cache (si existe)
    const leaderboardCache = await prisma.leaderboardCache.findUnique({
      where: { userId: currentUser.id },
    })

    // Obtener todas las predicciones del usuario con información del partido
    const predictions = await prisma.prediction.findMany({
      where: { userId: currentUser.id },
      include: {
        match: {
          select: {
            id: true,
            matchDate: true,
            status: true,
            homeScore: true,
            awayScore: true,
            phase: {
              select: {
                id: true,
                name: true,
                slug: true,
                pointsMultiplier: true,
              },
            },
          },
        },
      },
      orderBy: { match: { matchDate: 'asc' } },
    })

    // Calcular estadísticas generales
    const totalPoints = leaderboardCache?.totalPoints ?? 0
    const ranking = leaderboardCache?.ranking ?? null
    const totalPredictions = predictions.length
    const correctPredictions =
      leaderboardCache?.correctPredictions ??
      predictions.filter((p) => p.pointsEarned > 0).length
    const exactScores =
      leaderboardCache?.exactScores ??
      predictions.filter((p) => {
        const match = p.match
        return (
          match.status === 'FINISHED' &&
          match.homeScore !== null &&
          match.awayScore !== null &&
          p.predictedHomeScore === match.homeScore &&
          p.predictedAwayScore === match.awayScore
        )
      }).length

    const accuracyRate =
      totalPredictions > 0
        ? ((correctPredictions / totalPredictions) * 100).toFixed(2)
        : '0.00'

    // Mejor predicción (más puntos)
    const bestPrediction =
      predictions.length > 0
        ? predictions.reduce((best, current) => {
            return current.pointsEarned > best.pointsEarned ? current : best
          }, predictions[0])
        : null

    // Racha actual (consecutivas correctas o incorrectas)
    let currentStreak = 0
    let streakType: 'correct' | 'incorrect' | null = null

    // Ordenar predicciones por fecha descendente (más reciente primero)
    const sortedPredictions = [...predictions].sort(
      (a, b) =>
        new Date(b.match.matchDate).getTime() -
        new Date(a.match.matchDate).getTime()
    )

    // Contar racha desde la más reciente
    for (const prediction of sortedPredictions) {
      if (prediction.match.status !== 'FINISHED') continue

      const isCorrect = prediction.pointsEarned > 0

      if (streakType === null) {
        streakType = isCorrect ? 'correct' : 'incorrect'
        currentStreak = 1
      } else if (
        (streakType === 'correct' && isCorrect) ||
        (streakType === 'incorrect' && !isCorrect)
      ) {
        currentStreak++
      } else {
        break
      }
    }

    // Evolución de puntos (array para gráfico)
    // Agrupar por fecha del partido y acumular puntos
    const pointsEvolution: Array<{
      date: string
      points: number
      cumulative: number
    }> = []
    let cumulativePoints = 0

    const sortedByDate = [...predictions].sort(
      (a, b) =>
        new Date(a.match.matchDate).getTime() -
        new Date(b.match.matchDate).getTime()
    )

    for (const prediction of sortedByDate) {
      if (prediction.match.status === 'FINISHED') {
        cumulativePoints += prediction.pointsEarned
        pointsEvolution.push({
          date: prediction.match.matchDate.toISOString(),
          points: prediction.pointsEarned,
          cumulative: cumulativePoints,
        })
      }
    }

    // Estadísticas por fase
    const statsByPhase: Array<{
      phaseId: string
      phaseName: string
      phaseSlug: string
      totalPredictions: number
      correctPredictions: number
      exactScores: number
      totalPoints: number
      accuracyRate: string
      avgPoints: string
    }> = []

    // Agrupar predicciones por fase
    const phaseMap = new Map<string, typeof predictions>()

    for (const prediction of predictions) {
      const phaseId = prediction.match.phase.id
      if (!phaseMap.has(phaseId)) {
        phaseMap.set(phaseId, [])
      }
      phaseMap.get(phaseId)!.push(prediction)
    }

    // Calcular stats por fase
    for (const [, phasePredictions] of phaseMap.entries()) {
      const phase = phasePredictions[0].match.phase
      const totalPhasePredictions = phasePredictions.length
      const correctPhasePredictions = phasePredictions.filter(
        (p) => p.pointsEarned > 0
      ).length
      const exactPhaseScores = phasePredictions.filter((p) => {
        const match = p.match
        return (
          match.status === 'FINISHED' &&
          match.homeScore !== null &&
          match.awayScore !== null &&
          p.predictedHomeScore === match.homeScore &&
          p.predictedAwayScore === match.awayScore
        )
      }).length
      const totalPhasePoints = phasePredictions.reduce(
        (sum, p) => sum + p.pointsEarned,
        0
      )
      const phaseAccuracyRate =
        totalPhasePredictions > 0
          ? ((correctPhasePredictions / totalPhasePredictions) * 100).toFixed(2)
          : '0.00'
      const avgPhasePoints =
        totalPhasePredictions > 0
          ? (totalPhasePoints / totalPhasePredictions).toFixed(2)
          : '0.00'

      statsByPhase.push({
        phaseId: phase.id,
        phaseName: phase.name,
        phaseSlug: phase.slug,
        totalPredictions: totalPhasePredictions,
        correctPredictions: correctPhasePredictions,
        exactScores: exactPhaseScores,
        totalPoints: totalPhasePoints,
        accuracyRate: phaseAccuracyRate,
        avgPoints: avgPhasePoints,
      })
    }

    // Comparación con promedio general
    const globalStats = await prisma.leaderboardCache.aggregate({
      _avg: {
        totalPoints: true,
        accuracyRate: true,
      },
      _count: {
        userId: true,
      },
    })

    const globalAvgPoints =
      globalStats._avg.totalPoints !== null
        ? Number(globalStats._avg.totalPoints)
        : 0
    const globalAvgAccuracy =
      globalStats._avg.accuracyRate !== null
        ? Number(globalStats._avg.accuracyRate)
        : 0

    // Comparación de puntos
    const pointsComparison =
      globalAvgPoints > 0
        ? (((totalPoints - globalAvgPoints) / globalAvgPoints) * 100).toFixed(2)
        : '0.00'

    // Comparación de accuracy
    const accuracyComparison =
      globalAvgAccuracy > 0
        ? (
            ((Number(accuracyRate) - globalAvgAccuracy) / globalAvgAccuracy) *
            100
          ).toFixed(2)
        : '0.00'

    return NextResponse.json({
      // Estadísticas generales
      totalPoints,
      ranking,
      totalPredictions,
      correctPredictions,
      exactScores,
      accuracyRate,
      bestPrediction:
        bestPrediction && bestPrediction.pointsEarned > 0
          ? {
              matchId: bestPrediction.match.id,
              matchDate: bestPrediction.match.matchDate,
              pointsEarned: bestPrediction.pointsEarned,
              predictedScore: `${bestPrediction.predictedHomeScore}-${bestPrediction.predictedAwayScore}`,
              actualScore:
                bestPrediction.match.status === 'FINISHED' &&
                bestPrediction.match.homeScore !== null &&
                bestPrediction.match.awayScore !== null
                  ? `${bestPrediction.match.homeScore}-${bestPrediction.match.awayScore}`
                  : null,
            }
          : null,
      currentStreak: {
        type: streakType,
        count: currentStreak,
      },
      pointsEvolution,
      statsByPhase,
      comparison: {
        globalAvgPoints: globalAvgPoints.toFixed(2),
        globalAvgAccuracy: globalAvgAccuracy.toFixed(2),
        totalUsers: globalStats._count.userId,
        pointsDifference: pointsComparison,
        accuracyDifference: accuracyComparison,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
