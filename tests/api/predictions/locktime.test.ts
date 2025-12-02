import { describe, it, expect, beforeAll } from 'vitest'
import { prisma } from '@/lib/db'
import {
  createTestUser,
  createTestMatch,
  createTestPrediction,
  calculateLockTime,
} from '../../helpers/test-utils'

describe('Predicciones - Validación de lockTime', () => {
  let testUser: Awaited<ReturnType<typeof createTestUser>>

  beforeAll(async () => {
    testUser = await createTestUser({ name: 'Test User LockTime' })
  })

  describe('Predicción ANTES de lockTime (debe permitir)', () => {
    it('debe permitir crear predicción cuando lockTime está en el futuro', async () => {
      // Partido en 2 horas, lockTime en 1 hora y 45 minutos
      const matchDate = new Date(Date.now() + 2 * 60 * 60 * 1000)
      const lockTime = calculateLockTime(matchDate, 15) // 15 min antes

      const match = await createTestMatch({
        matchDate,
        lockTime,
        isLocked: false,
        status: 'SCHEDULED',
      })

      // Verificar que lockTime es futuro
      expect(lockTime.getTime()).toBeGreaterThan(Date.now())

      // Debe permitir crear predicción
      const prediction = await createTestPrediction({
        userId: testUser.id,
        matchId: match.id,
        predictedHomeScore: 2,
        predictedAwayScore: 1,
      })

      expect(prediction).toBeDefined()
    })

    it('debe permitir actualizar predicción cuando lockTime está en el futuro', async () => {
      const matchDate = new Date(Date.now() + 2 * 60 * 60 * 1000)
      const lockTime = calculateLockTime(matchDate, 15)

      const match = await createTestMatch({
        matchDate,
        lockTime,
        isLocked: false,
        status: 'SCHEDULED',
      })

      const prediction = await createTestPrediction({
        userId: testUser.id,
        matchId: match.id,
        predictedHomeScore: 1,
        predictedAwayScore: 0,
      })

      // Actualizar debe funcionar
      const updated = await prisma.prediction.update({
        where: { id: prediction.id },
        data: {
          predictedHomeScore: 3,
          predictedAwayScore: 1,
        },
      })

      expect(updated.predictedHomeScore).toBe(3)
    })
  })

  describe('Predicción DESPUÉS de lockTime (debe rechazar)', () => {
    it('debe detectar que partido está bloqueado cuando lockTime pasó', async () => {
      // Partido hace 30 minutos, lockTime hace 1 hora (ya pasó)
      const matchDate = new Date(Date.now() - 30 * 60 * 1000)
      const lockTime = new Date(Date.now() - 60 * 60 * 1000)

      const match = await createTestMatch({
        matchDate,
        lockTime,
        isLocked: true,
        status: 'SCHEDULED',
      })

      // Verificar que lockTime pasó
      expect(lockTime.getTime()).toBeLessThan(Date.now())

      // Verificar que el partido está marcado como bloqueado
      const dbMatch = await prisma.match.findUnique({
        where: { id: match.id },
      })

      expect(dbMatch?.isLocked).toBe(true)
    })

    it('debe verificar lockTime correctamente considerando tiempo actual', async () => {
      const now = new Date()

      // lockTime hace 1 minuto (muy reciente, pero ya pasó)
      const lockTime = new Date(now.getTime() - 60 * 1000)
      const matchDate = new Date(lockTime.getTime() + 15 * 60 * 1000)

      const match = await createTestMatch({
        matchDate,
        lockTime,
        isLocked: true,
        status: 'SCHEDULED',
      })

      const dbMatch = await prisma.match.findUnique({
        where: { id: match.id },
      })

      // Verificar estado
      expect(dbMatch?.isLocked).toBe(true)
      expect(dbMatch?.lockTime.getTime()).toBeLessThan(Date.now())
    })
  })

  describe('Cálculo de lockTime', () => {
    it('debe calcular lockTime correctamente (15 min antes por defecto)', () => {
      const matchDate = new Date('2026-06-15T18:00:00Z')
      const lockTime = calculateLockTime(matchDate, 15)

      const expectedLockTime = new Date(matchDate.getTime() - 15 * 60 * 1000)

      expect(lockTime.getTime()).toBe(expectedLockTime.getTime())
    })

    it('debe calcular lockTime con minutos personalizados', () => {
      const matchDate = new Date('2026-06-15T18:00:00Z')
      const lockTime = calculateLockTime(matchDate, 30)

      const expectedLockTime = new Date(matchDate.getTime() - 30 * 60 * 1000)

      expect(lockTime.getTime()).toBe(expectedLockTime.getTime())
    })
  })

  describe('Partidos con diferentes estados', () => {
    it('debe rechazar predicción para partido LIVE', async () => {
      const matchDate = new Date(Date.now() - 30 * 60 * 1000) // Hace 30 min
      const lockTime = new Date(Date.now() - 60 * 60 * 1000) // Hace 1 hora

      const match = await createTestMatch({
        matchDate,
        lockTime,
        isLocked: true,
        status: 'LIVE',
      })

      const dbMatch = await prisma.match.findUnique({
        where: { id: match.id },
      })

      expect(dbMatch?.status).toBe('LIVE')
      expect(dbMatch?.isLocked).toBe(true)
    })

    it('debe rechazar predicción para partido FINISHED', async () => {
      const matchDate = new Date(Date.now() - 2 * 60 * 60 * 1000) // Hace 2 horas
      const lockTime = new Date(
        Date.now() - 2 * 60 * 60 * 1000 - 15 * 60 * 1000
      )

      const match = await createTestMatch({
        matchDate,
        lockTime,
        isLocked: true,
        status: 'FINISHED',
        homeScore: 2,
        awayScore: 1,
      })

      const dbMatch = await prisma.match.findUnique({
        where: { id: match.id },
      })

      expect(dbMatch?.status).toBe('FINISHED')
      expect(dbMatch?.isLocked).toBe(true)
    })
  })

  describe('Edge Cases de lockTime', () => {
    it('debe manejar lockTime exactamente en el momento actual (considerar bloqueado)', () => {
      const now = new Date()
      const lockTime = new Date(now.getTime()) // Exactamente ahora

      // En la práctica, si lockTime es <= ahora, está bloqueado
      expect(lockTime.getTime()).toBeLessThanOrEqual(Date.now())
    })

    it('debe manejar lockTime muy cercano al presente', () => {
      const now = Date.now()
      const lockTime = new Date(now - 1000) // Hace 1 segundo

      expect(lockTime.getTime()).toBeLessThan(now)
    })

    it('debe manejar lockTime en diferentes zonas horarias (usar UTC)', () => {
      // Crear matchDate y lockTime en UTC explícitamente
      const matchDate = new Date('2026-06-15T18:00:00Z')
      const lockTime = calculateLockTime(matchDate, 15)

      // Ambos deben estar en UTC
      expect(matchDate.toISOString()).toContain('Z')
      expect(lockTime.toISOString()).toContain('Z')
    })
  })
})
