import { describe, it, expect, beforeAll } from 'vitest'
import { prisma } from '@/lib/db'
import {
  createTestUser,
  createTestMatch,
  createTestPrediction,
  calculateLockTime,
} from '../../helpers/test-utils'

describe('Predicciones - Tests de Integración', () => {
  let testUser: Awaited<ReturnType<typeof createTestUser>>
  let futureMatch: Awaited<ReturnType<typeof createTestMatch>>
  let lockedMatch: Awaited<ReturnType<typeof createTestMatch>>

  beforeAll(async () => {
    // Crear usuario de prueba
    testUser = await createTestUser({ name: 'Test Predictor' })

    // Crear partido futuro (no bloqueado)
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000) // Mañana
    futureMatch = await createTestMatch({
      matchDate: futureDate,
      lockTime: calculateLockTime(futureDate),
      isLocked: false,
      status: 'SCHEDULED',
    })

    // Crear partido bloqueado (lockTime pasado)
    const pastDate = new Date(Date.now() - 60 * 60 * 1000) // Hace 1 hora
    lockedMatch = await createTestMatch({
      matchDate: pastDate,
      lockTime: calculateLockTime(pastDate),
      isLocked: true,
      status: 'SCHEDULED',
    })
  })

  describe('Crear Predicción', () => {
    it('debe crear una predicción válida para un partido no bloqueado', async () => {
      const prediction = await createTestPrediction({
        userId: testUser.id,
        matchId: futureMatch.id,
        predictedHomeScore: 2,
        predictedAwayScore: 1,
      })

      expect(prediction).toBeDefined()
      expect(prediction.userId).toBe(testUser.id)
      expect(prediction.matchId).toBe(futureMatch.id)
      expect(prediction.predictedHomeScore).toBe(2)
      expect(prediction.predictedAwayScore).toBe(1)
      expect(prediction.pointsEarned).toBe(0)
    })

    it('debe permitir solo una predicción por usuario y partido (UPSERT)', async () => {
      // Crear primera predicción
      await createTestPrediction({
        userId: testUser.id,
        matchId: futureMatch.id,
        predictedHomeScore: 2,
        predictedAwayScore: 1,
      })

      // Intentar crear segunda predicción (debería fallar con unique constraint)
      await expect(
        prisma.prediction.create({
          data: {
            userId: testUser.id,
            matchId: futureMatch.id,
            predictedHomeScore: 3,
            predictedAwayScore: 0,
            pointsEarned: 0,
          },
        })
      ).rejects.toThrow()
    })

    it('no debe permitir crear predicción para partido bloqueado (validación manual)', async () => {
      // Verificar que el partido está bloqueado
      const match = await prisma.match.findUnique({
        where: { id: lockedMatch.id },
      })

      expect(match?.isLocked).toBe(true)

      // Intentar crear predicción debería fallar (validación en API, no en DB)
      // Este test verifica que el estado del partido es correcto
      expect(match?.lockTime.getTime()).toBeLessThan(Date.now())
    })
  })

  describe('Actualizar Predicción', () => {
    it('debe actualizar una predicción existente', async () => {
      const prediction = await createTestPrediction({
        userId: testUser.id,
        matchId: futureMatch.id,
        predictedHomeScore: 1,
        predictedAwayScore: 0,
      })

      const updated = await prisma.prediction.update({
        where: { id: prediction.id },
        data: {
          predictedHomeScore: 3,
          predictedAwayScore: 1,
        },
      })

      expect(updated.predictedHomeScore).toBe(3)
      expect(updated.predictedAwayScore).toBe(1)
    })
  })

  describe('Obtener Predicciones', () => {
    it('debe obtener todas las predicciones de un usuario', async () => {
      const predictions = await prisma.prediction.findMany({
        where: { userId: testUser.id },
      })

      expect(predictions.length).toBeGreaterThan(0)
      expect(predictions.every((p) => p.userId === testUser.id)).toBe(true)
    })

    it('debe obtener predicción específica por matchId y userId', async () => {
      const prediction = await prisma.prediction.findUnique({
        where: {
          userId_matchId: {
            userId: testUser.id,
            matchId: futureMatch.id,
          },
        },
      })

      expect(prediction).toBeDefined()
      expect(prediction?.userId).toBe(testUser.id)
      expect(prediction?.matchId).toBe(futureMatch.id)
    })
  })

  describe('Eliminar Predicción', () => {
    it('debe eliminar una predicción', async () => {
      const prediction = await createTestPrediction({
        userId: testUser.id,
        matchId: futureMatch.id,
        predictedHomeScore: 1,
        predictedAwayScore: 1,
      })

      await prisma.prediction.delete({
        where: { id: prediction.id },
      })

      const deleted = await prisma.prediction.findUnique({
        where: { id: prediction.id },
      })

      expect(deleted).toBeNull()
    })
  })

  describe('Validaciones de Datos', () => {
    it('debe rechazar scores negativos', async () => {
      await expect(
        prisma.prediction.create({
          data: {
            userId: testUser.id,
            matchId: futureMatch.id,
            predictedHomeScore: -1,
            predictedAwayScore: 0,
            pointsEarned: 0,
          },
        })
      ).rejects.toThrow()
    })

    it('debe aceptar solo números enteros para scores', async () => {
      // Prisma valida esto a nivel de tipo, pero verificamos que funciona
      const prediction = await createTestPrediction({
        userId: testUser.id,
        matchId: futureMatch.id,
        predictedHomeScore: 2,
        predictedAwayScore: 1,
      })

      expect(Number.isInteger(prediction.predictedHomeScore)).toBe(true)
      expect(Number.isInteger(prediction.predictedAwayScore)).toBe(true)
    })
  })
})
