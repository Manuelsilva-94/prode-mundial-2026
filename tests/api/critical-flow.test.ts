import { describe, it, expect, beforeAll } from 'vitest'
import { prisma } from '@/lib/db'
import {
  createTestUser,
  createTestMatch,
  createTestPrediction,
  calculateLockTime,
} from '../helpers/test-utils'
import { calculatePointsForMatch } from '@/lib/scoring/match-processor'
import { updateLeaderboards } from '@/lib/scoring/match-processor'

/**
 * FLUJO CRÍTICO COMPLETO
 *
 * 1. Usuario crea predicción
 * 2. Partido cambia estado a finalizado y se guarda resultado
 * 3. Se calculan puntos
 * 4. Se actualiza leaderboard
 * 5. Traer las posiciones del leaderboard
 */
describe('Flujo Crítico Completo', () => {
  let testUser: Awaited<ReturnType<typeof createTestUser>>
  let match: Awaited<ReturnType<typeof createTestMatch>>

  beforeAll(async () => {
    testUser = await createTestUser({ name: 'Usuario Test' })
  })

  it('debe completar el flujo completo: predicción → resultado → puntos → leaderboard', async () => {
    // ============================================
    // PASO 1: Usuario crea predicción
    // ============================================
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000) // Mañana
    match = await createTestMatch({
      matchDate: futureDate,
      lockTime: calculateLockTime(futureDate),
      isLocked: false,
      status: 'SCHEDULED',
    })

    const prediction = await createTestPrediction({
      userId: testUser.id,
      matchId: match.id,
      predictedHomeScore: 2,
      predictedAwayScore: 1,
    })

    expect(prediction).toBeDefined()
    expect(prediction.predictedHomeScore).toBe(2)
    expect(prediction.predictedAwayScore).toBe(1)
    expect(prediction.pointsEarned).toBe(0) // Aún no tiene puntos

    // ============================================
    // PASO 2: Partido cambia a FINISHED y se guarda resultado
    // ============================================
    const updatedMatch = await prisma.match.update({
      where: { id: match.id },
      data: {
        status: 'FINISHED',
        homeScore: 2,
        awayScore: 1,
        isLocked: true,
      },
    })

    expect(updatedMatch.status).toBe('FINISHED')
    expect(updatedMatch.homeScore).toBe(2)
    expect(updatedMatch.awayScore).toBe(1)
    expect(updatedMatch.isLocked).toBe(true)

    // ============================================
    // PASO 3: Se calculan puntos automáticamente
    // ============================================
    const pointsResult = await calculatePointsForMatch(match.id)

    expect(pointsResult).toBeDefined()
    expect(pointsResult.predictionsProcessed).toBeGreaterThan(0)
    expect(pointsResult.totalPointsAwarded).toBeGreaterThan(0)

    // Verificar que la predicción tiene puntos asignados
    const predictionWithPoints = await prisma.prediction.findUnique({
      where: { id: prediction.id },
    })

    expect(predictionWithPoints?.pointsEarned).toBe(12) // Resultado exacto = 12 puntos
    expect(predictionWithPoints?.pointsBreakdown).toBeDefined()

    // ============================================
    // PASO 4: Se actualiza leaderboard
    // ============================================
    await updateLeaderboards()

    const leaderboardCache = await prisma.leaderboardCache.findUnique({
      where: { userId: testUser.id },
    })

    expect(leaderboardCache).toBeDefined()
    expect(leaderboardCache?.totalPoints).toBe(12)
    expect(leaderboardCache?.totalPredictions).toBe(1)
    expect(leaderboardCache?.correctPredictions).toBe(1)
    expect(leaderboardCache?.exactScores).toBe(1)
    expect(leaderboardCache?.ranking).toBeGreaterThan(0)

    // ============================================
    // PASO 5: Traer las posiciones del leaderboard
    // ============================================
    const leaderboard = await prisma.leaderboardCache.findMany({
      orderBy: { totalPoints: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    })

    expect(leaderboard.length).toBeGreaterThan(0)

    // Verificar que el usuario está en el leaderboard
    const userEntry = leaderboard.find((entry) => entry.userId === testUser.id)
    expect(userEntry).toBeDefined()
    expect(userEntry?.totalPoints).toBe(12)
    expect(userEntry?.ranking).toBeDefined()

    // Verificar ordenamiento
    for (let i = 0; i < leaderboard.length - 1; i++) {
      expect(leaderboard[i].totalPoints).toBeGreaterThanOrEqual(
        leaderboard[i + 1].totalPoints
      )
    }
  })

  it('debe manejar múltiples usuarios en el flujo completo', async () => {
    // Crear usuarios adicionales
    const user2 = await createTestUser({ name: 'Usuario 2' })
    const user3 = await createTestUser({ name: 'Usuario 3' })

    // Crear partido
    const futureDate = new Date(Date.now() + 48 * 60 * 60 * 1000) // Pasado mañana
    const match = await createTestMatch({
      matchDate: futureDate,
      lockTime: calculateLockTime(futureDate),
      isLocked: false,
      status: 'SCHEDULED',
    })

    // Cada usuario hace una predicción diferente
    await createTestPrediction({
      userId: testUser.id,
      matchId: match.id,
      predictedHomeScore: 2,
      predictedAwayScore: 1,
    })

    await createTestPrediction({
      userId: user2.id,
      matchId: match.id,
      predictedHomeScore: 3,
      predictedAwayScore: 0, // Diferente pero mismo ganador
    })

    await createTestPrediction({
      userId: user3.id,
      matchId: match.id,
      predictedHomeScore: 1,
      predictedAwayScore: 2, // Ganador diferente
    })

    // Finalizar partido con resultado 2-1
    await prisma.match.update({
      where: { id: match.id },
      data: {
        status: 'FINISHED',
        homeScore: 2,
        awayScore: 1,
        isLocked: true,
      },
    })

    // Calcular puntos
    await calculatePointsForMatch(match.id)

    // Actualizar leaderboard
    await updateLeaderboards()

    // Verificar que todos los usuarios están en el leaderboard
    const leaderboard = await prisma.leaderboardCache.findMany({
      where: {
        userId: {
          in: [testUser.id, user2.id, user3.id],
        },
      },
      orderBy: { totalPoints: 'desc' },
    })

    expect(leaderboard.length).toBe(3)

    // Usuario 1: predicción exacta (12 puntos)
    const user1Lb = leaderboard.find((lb) => lb.userId === testUser.id)
    expect(user1Lb?.totalPoints).toBe(12)
    expect(user1Lb?.exactScores).toBe(1)

    // Usuario 2: solo ganador correcto (5 puntos)
    const user2Lb = leaderboard.find((lb) => lb.userId === user2.id)
    expect(user2Lb?.totalPoints).toBe(5)
    expect(user2Lb?.exactScores).toBe(0)

    // Usuario 3: todo incorrecto (0 puntos)
    const user3Lb = leaderboard.find((lb) => lb.userId === user3.id)
    expect(user3Lb?.totalPoints).toBe(0)
    expect(user3Lb?.correctPredictions).toBe(0)

    // Verificar que el ranking está ordenado correctamente
    expect(user1Lb?.ranking).toBeLessThan(user2Lb?.ranking || Infinity)
    expect(user2Lb?.ranking).toBeLessThan(user3Lb?.ranking || Infinity)
  })

  it('debe actualizar ranking cuando se calculan puntos de múltiples partidos', async () => {
    // Crear segundo partido
    const match2 = await createTestMatch({
      matchDate: new Date(Date.now() + 72 * 60 * 60 * 1000), // En 3 días
      lockTime: calculateLockTime(new Date(Date.now() + 72 * 60 * 60 * 1000)),
      isLocked: false,
      status: 'SCHEDULED',
    })

    // Usuario hace predicción
    await createTestPrediction({
      userId: testUser.id,
      matchId: match2.id,
      predictedHomeScore: 1,
      predictedAwayScore: 0,
    })

    // Obtener ranking actual
    const currentLb = await prisma.leaderboardCache.findUnique({
      where: { userId: testUser.id },
    })
    const previousRanking = currentLb?.ranking || 0
    const previousPoints = currentLb?.totalPoints || 0

    // Finalizar partido con resultado exacto
    await prisma.match.update({
      where: { id: match2.id },
      data: {
        status: 'FINISHED',
        homeScore: 1,
        awayScore: 0,
        isLocked: true,
      },
    })

    // Calcular puntos y actualizar leaderboard
    await calculatePointsForMatch(match2.id)
    await updateLeaderboards()

    // Verificar que los puntos se acumularon
    const updatedLb = await prisma.leaderboardCache.findUnique({
      where: { userId: testUser.id },
    })

    expect(updatedLb?.totalPoints).toBeGreaterThan(previousPoints)
    expect(updatedLb?.totalPredictions).toBeGreaterThan(
      currentLb?.totalPredictions || 0
    )

    // Verificar que previousRanking se guardó
    expect(updatedLb?.previousRanking).toBe(previousRanking)
  })
})
