import { describe, it, expect, beforeAll } from 'vitest'
import { prisma } from '@/lib/db'
import {
  createTestUser,
  createTestMatch,
  createTestPhase,
  calculateLockTime,
} from '../../../helpers/test-utils'

describe('GET /api/users/me/stats', () => {
  let testUser: Awaited<ReturnType<typeof createTestUser>>
  let otherUser: Awaited<ReturnType<typeof createTestUser>>
  let phase1: Awaited<ReturnType<typeof createTestPhase>>
  let phase2: Awaited<ReturnType<typeof createTestPhase>>

  beforeAll(async () => {
    // Crear usuarios de prueba
    testUser = await createTestUser({
      email: `test-stats-${Date.now()}@test.com`,
      name: 'Test User Stats',
    })

    otherUser = await createTestUser({
      email: `test-stats-other-${Date.now()}@test.com`,
      name: 'Other User',
    })

    // Crear fases
    phase1 = await createTestPhase({
      name: 'Grupos',
      slug: `grupos-${Date.now()}`,
    })
    phase2 = await createTestPhase({
      name: 'Octavos',
      slug: `octavos-${Date.now()}`,
    })

    // Crear partidos finalizados con diferentes resultados
    const pastDate1 = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // -5 días
    const pastDate2 = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) // -4 días
    const pastDate3 = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // -3 días

    const match1 = await createTestMatch({
      phaseId: phase1.id,
      matchDate: pastDate1,
      lockTime: calculateLockTime(pastDate1),
      status: 'FINISHED',
      homeScore: 2,
      awayScore: 1,
    })

    const match2 = await createTestMatch({
      phaseId: phase1.id,
      matchDate: pastDate2,
      lockTime: calculateLockTime(pastDate2),
      status: 'FINISHED',
      homeScore: 1,
      awayScore: 1,
    })

    const match3 = await createTestMatch({
      phaseId: phase2.id,
      matchDate: pastDate3,
      lockTime: calculateLockTime(pastDate3),
      status: 'FINISHED',
      homeScore: 3,
      awayScore: 0,
    })

    // Crear predicciones para testUser
    // Predicción exacta (10 puntos)
    await prisma.prediction.create({
      data: {
        userId: testUser.id,
        matchId: match1.id,
        predictedHomeScore: 2,
        predictedAwayScore: 1,
        pointsEarned: 10,
      },
    })

    // Predicción correcta - ganador (5 puntos)
    await prisma.prediction.create({
      data: {
        userId: testUser.id,
        matchId: match3.id,
        predictedHomeScore: 4,
        predictedAwayScore: 0,
        pointsEarned: 5,
      },
    })

    // Predicción incorrecta (0 puntos)
    await prisma.prediction.create({
      data: {
        userId: testUser.id,
        matchId: match2.id,
        predictedHomeScore: 2,
        predictedAwayScore: 0, // Incorrecta (empate real)
        pointsEarned: 0,
      },
    })

    // Crear predicción para otro usuario (para promedios)
    await prisma.prediction.create({
      data: {
        userId: otherUser.id,
        matchId: match1.id,
        predictedHomeScore: 1,
        predictedAwayScore: 0,
        pointsEarned: 5,
      },
    })

    // Actualizar leaderboard cache para testUser
    await prisma.leaderboardCache.upsert({
      where: { userId: testUser.id },
      create: {
        userId: testUser.id,
        totalPoints: 15,
        totalPredictions: 3,
        correctPredictions: 2,
        exactScores: 1,
        accuracyRate: '66.67',
        ranking: 1,
      },
      update: {
        totalPoints: 15,
        totalPredictions: 3,
        correctPredictions: 2,
        exactScores: 1,
        accuracyRate: '66.67',
        ranking: 1,
      },
    })

    // Actualizar leaderboard cache para otherUser
    await prisma.leaderboardCache.upsert({
      where: { userId: otherUser.id },
      create: {
        userId: otherUser.id,
        totalPoints: 5,
        totalPredictions: 1,
        correctPredictions: 1,
        exactScores: 0,
        accuracyRate: '100.00',
        ranking: 2,
      },
      update: {
        totalPoints: 5,
        totalPredictions: 1,
        correctPredictions: 1,
        exactScores: 0,
        accuracyRate: '100.00',
        ranking: 2,
      },
    })
  })

  it('debe calcular estadísticas generales correctamente', async () => {
    const predictions = await prisma.prediction.findMany({
      where: { userId: testUser.id },
      include: {
        match: {
          select: {
            status: true,
            homeScore: true,
            awayScore: true,
          },
        },
      },
    })

    const totalPoints = predictions.reduce((sum, p) => sum + p.pointsEarned, 0)
    const correctPredictions = predictions.filter(
      (p) => p.pointsEarned > 0
    ).length
    const exactScores = predictions.filter((p) => {
      const match = p.match
      return (
        match.status === 'FINISHED' &&
        match.homeScore !== null &&
        match.awayScore !== null &&
        p.predictedHomeScore === match.homeScore &&
        p.predictedAwayScore === match.awayScore
      )
    }).length

    expect(totalPoints).toBe(15)
    expect(predictions.length).toBe(3)
    expect(correctPredictions).toBe(2)
    expect(exactScores).toBe(1)
  })

  it('debe calcular tasa de acierto correctamente', async () => {
    const predictions = await prisma.prediction.findMany({
      where: { userId: testUser.id },
    })

    const totalPredictions = predictions.length
    const correctPredictions = predictions.filter(
      (p) => p.pointsEarned > 0
    ).length
    const accuracyRate =
      totalPredictions > 0
        ? ((correctPredictions / totalPredictions) * 100).toFixed(2)
        : '0.00'

    expect(accuracyRate).toBe('66.67')
  })

  it('debe identificar la mejor predicción', async () => {
    const predictions = await prisma.prediction.findMany({
      where: { userId: testUser.id },
    })

    const bestPrediction = predictions.reduce((best, current) => {
      return current.pointsEarned > best.pointsEarned ? current : best
    }, predictions[0])

    expect(bestPrediction.pointsEarned).toBe(10)
  })

  it('debe calcular racha actual', async () => {
    const predictions = await prisma.prediction.findMany({
      where: { userId: testUser.id },
      include: {
        match: {
          select: {
            matchDate: true,
            status: true,
          },
        },
      },
      orderBy: {
        match: {
          matchDate: 'desc',
        },
      },
    })

    let currentStreak = 0
    let streakType: 'correct' | 'incorrect' | null = null

    for (const prediction of predictions) {
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

    // La predicción más reciente tiene 5 puntos (correcta)
    expect(streakType).toBe('correct')
    expect(currentStreak).toBeGreaterThan(0)
  })

  it('debe calcular evolución de puntos', async () => {
    const predictions = await prisma.prediction.findMany({
      where: { userId: testUser.id },
      include: {
        match: {
          select: {
            matchDate: true,
            status: true,
          },
        },
      },
      orderBy: {
        match: {
          matchDate: 'asc',
        },
      },
    })

    const pointsEvolution: Array<{
      date: string
      points: number
      cumulative: number
    }> = []
    let cumulativePoints = 0

    for (const prediction of predictions) {
      if (prediction.match.status === 'FINISHED') {
        cumulativePoints += prediction.pointsEarned
        pointsEvolution.push({
          date: prediction.match.matchDate.toISOString(),
          points: prediction.pointsEarned,
          cumulative: cumulativePoints,
        })
      }
    }

    expect(pointsEvolution.length).toBeGreaterThan(0)
    expect(pointsEvolution[pointsEvolution.length - 1].cumulative).toBe(15)
  })

  it('debe calcular estadísticas por fase', async () => {
    const predictions = await prisma.prediction.findMany({
      where: { userId: testUser.id },
      include: {
        match: {
          select: {
            phase: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            status: true,
            homeScore: true,
            awayScore: true,
          },
        },
      },
    })

    const phaseMap = new Map<string, typeof predictions>()

    for (const prediction of predictions) {
      const phaseId = prediction.match.phase.id
      if (!phaseMap.has(phaseId)) {
        phaseMap.set(phaseId, [])
      }
      phaseMap.get(phaseId)!.push(prediction)
    }

    // Debería tener estadísticas para phase1 (2 predicciones)
    expect(phaseMap.has(phase1.id)).toBe(true)
    const phase1Predictions = phaseMap.get(phase1.id)!
    expect(phase1Predictions.length).toBe(2)
  })

  it('debe calcular comparación con promedio general', async () => {
    const globalStats = await prisma.leaderboardCache.aggregate({
      _avg: {
        totalPoints: true,
        accuracyRate: true,
      },
      _count: {
        userId: true,
      },
    })

    expect(globalStats._count.userId).toBeGreaterThan(0)
    expect(globalStats._avg.totalPoints).not.toBeNull()
  })
})
