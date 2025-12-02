import { describe, it, expect, beforeAll } from 'vitest'
import { prisma } from '@/lib/db'
import {
  createTestUser,
  createTestMatch,
  createTestPrediction,
  calculateLockTime,
} from '../../helpers/test-utils'
import { updateLeaderboards } from '@/lib/scoring/match-processor'
import { calculatePointsForMatch } from '@/lib/scoring/match-processor'

describe('Leaderboard - Tests de Cálculo y Ranking', () => {
  let user1: Awaited<ReturnType<typeof createTestUser>>
  let user2: Awaited<ReturnType<typeof createTestUser>>
  let user3: Awaited<ReturnType<typeof createTestUser>>
  let finishedMatch: Awaited<ReturnType<typeof createTestMatch>>

  beforeAll(async () => {
    // Crear usuarios de prueba
    user1 = await createTestUser({ name: 'Usuario 1' })
    user2 = await createTestUser({ name: 'Usuario 2' })
    user3 = await createTestUser({ name: 'Usuario 3' })

    // Crear partido finalizado con resultado
    const pastDate = new Date(Date.now() - 2 * 60 * 60 * 1000)
    finishedMatch = await createTestMatch({
      matchDate: pastDate,
      lockTime: calculateLockTime(pastDate),
      status: 'FINISHED',
      homeScore: 2,
      awayScore: 1,
      isLocked: true,
    })
  })

  describe('Cálculo de Estadísticas', () => {
    it('debe calcular correctPredictions como todas las predicciones con puntos > 0', async () => {
      // Usuario 1: predicción exacta (12 puntos)
      await createTestPrediction({
        userId: user1.id,
        matchId: finishedMatch.id,
        predictedHomeScore: 2,
        predictedAwayScore: 1,
      })

      // Usuario 2: predicción parcial (5 puntos - solo ganador)
      await createTestPrediction({
        userId: user2.id,
        matchId: finishedMatch.id,
        predictedHomeScore: 3,
        predictedAwayScore: 0,
      })

      // Usuario 3: predicción incorrecta (0 puntos)
      await createTestPrediction({
        userId: user3.id,
        matchId: finishedMatch.id,
        predictedHomeScore: 1,
        predictedAwayScore: 2,
      })

      // Calcular puntos
      await calculatePointsForMatch(finishedMatch.id)

      // Actualizar leaderboard
      await updateLeaderboards()

      // Verificar estadísticas
      const lb1 = await prisma.leaderboardCache.findUnique({
        where: { userId: user1.id },
      })
      const lb2 = await prisma.leaderboardCache.findUnique({
        where: { userId: user2.id },
      })
      const lb3 = await prisma.leaderboardCache.findUnique({
        where: { userId: user3.id },
      })

      expect(lb1?.correctPredictions).toBe(1) // Tiene puntos
      expect(lb2?.correctPredictions).toBe(1) // Tiene puntos
      expect(lb3?.correctPredictions).toBe(0) // No tiene puntos
    })

    it('debe calcular exactScores solo para predicciones exactas', async () => {
      const lb1 = await prisma.leaderboardCache.findUnique({
        where: { userId: user1.id },
      })
      const lb2 = await prisma.leaderboardCache.findUnique({
        where: { userId: user2.id },
      })

      expect(lb1?.exactScores).toBe(1) // Predicción exacta
      expect(lb2?.exactScores).toBe(0) // Predicción parcial
    })

    it('debe calcular totalPoints correctamente', async () => {
      const lb1 = await prisma.leaderboardCache.findUnique({
        where: { userId: user1.id },
      })
      const lb2 = await prisma.leaderboardCache.findUnique({
        where: { userId: user2.id },
      })

      expect(lb1?.totalPoints).toBe(12) // Resultado exacto
      expect(lb2?.totalPoints).toBe(5) // Solo ganador
    })

    it('debe calcular accuracyRate correctamente', async () => {
      const lb1 = await prisma.leaderboardCache.findUnique({
        where: { userId: user1.id },
      })
      const lb2 = await prisma.leaderboardCache.findUnique({
        where: { userId: user2.id },
      })

      // accuracyRate = (correctPredictions / totalPredictions) * 100
      expect(lb1?.accuracyRate).toBe('100') // 1/1 = 100%
      expect(Number(lb2?.accuracyRate)).toBeGreaterThan(0)
    })
  })

  describe('Ranking y Ordenamiento', () => {
    it('debe ordenar usuarios por totalPoints descendente', async () => {
      await updateLeaderboards()

      const leaderboard = await prisma.leaderboardCache.findMany({
        orderBy: { totalPoints: 'desc' },
        include: { user: true },
      })

      // Verificar que está ordenado
      for (let i = 0; i < leaderboard.length - 1; i++) {
        expect(leaderboard[i].totalPoints).toBeGreaterThanOrEqual(
          leaderboard[i + 1].totalPoints
        )
      }
    })

    it('debe asignar rankings correctos (1, 2, 3, ...)', async () => {
      await updateLeaderboards()

      const leaderboard = await prisma.leaderboardCache.findMany({
        orderBy: { ranking: 'asc' },
      })

      // Verificar que los rankings son secuenciales
      leaderboard.forEach((entry, index) => {
        expect(entry.ranking).toBe(index + 1)
      })
    })

    it('debe mostrar usuario con más puntos en primer lugar', async () => {
      const topUser = await prisma.leaderboardCache.findFirst({
        where: { ranking: 1 },
        include: { user: true },
      })

      expect(topUser).toBeDefined()
      expect(topUser?.totalPoints).toBeGreaterThanOrEqual(0)

      // Verificar que todos los demás tienen menos o igual puntos
      const allUsers = await prisma.leaderboardCache.findMany()
      allUsers.forEach((user) => {
        if (user.ranking !== 1) {
          expect(user.totalPoints).toBeLessThanOrEqual(
            topUser?.totalPoints || 0
          )
        }
      })
    })
  })

  describe('Evolución de Ranking', () => {
    it('debe guardar previousRanking al actualizar', async () => {
      // Obtener ranking actual
      const currentRanking = await prisma.leaderboardCache.findUnique({
        where: { userId: user1.id },
      })

      const previousRank = currentRanking?.ranking

      // Crear nuevo partido y actualizar
      const newMatch = await createTestMatch({
        matchDate: new Date(Date.now() - 1 * 60 * 60 * 1000),
        status: 'FINISHED',
        homeScore: 1,
        awayScore: 0,
        isLocked: true,
      })

      await createTestPrediction({
        userId: user1.id,
        matchId: newMatch.id,
        predictedHomeScore: 1,
        predictedAwayScore: 0,
      })

      await calculatePointsForMatch(newMatch.id)
      await updateLeaderboards()

      // Verificar previousRanking
      const updated = await prisma.leaderboardCache.findUnique({
        where: { userId: user1.id },
      })

      expect(updated?.previousRanking).toBe(previousRank)
    })

    it('debe calcular rankingChange correctamente', async () => {
      await updateLeaderboards()

      const lb = await prisma.leaderboardCache.findUnique({
        where: { userId: user1.id },
      })

      if (lb?.previousRanking && lb.ranking) {
        const expectedChange = lb.previousRanking - lb.ranking
        expect(lb.rankingChange).toBe(expectedChange)
      }
    })

    it('debe manejar usuarios nuevos (previousRanking = null)', async () => {
      const newUser = await createTestUser({ name: 'Usuario Nuevo' })

      await updateLeaderboards()

      const lb = await prisma.leaderboardCache.findUnique({
        where: { userId: newUser.id },
      })

      // Si no tiene predicciones, puede no existir o tener previousRanking null
      if (lb) {
        expect(lb.previousRanking).toBeNull()
        expect(lb.rankingChange).toBe(0)
      }
    })
  })

  describe('Múltiples Partidos', () => {
    it('debe acumular puntos de múltiples partidos', async () => {
      const match1 = await createTestMatch({
        matchDate: new Date(Date.now() - 3 * 60 * 60 * 1000),
        status: 'FINISHED',
        homeScore: 3,
        awayScore: 1,
        isLocked: true,
      })

      await createTestPrediction({
        userId: user1.id,
        matchId: match1.id,
        predictedHomeScore: 3,
        predictedAwayScore: 1,
      })

      await calculatePointsForMatch(match1.id)
      await updateLeaderboards()

      const lb = await prisma.leaderboardCache.findUnique({
        where: { userId: user1.id },
      })

      expect(lb?.totalPredictions).toBeGreaterThanOrEqual(2)
      expect(lb?.totalPoints).toBeGreaterThanOrEqual(12)
    })
  })
})
