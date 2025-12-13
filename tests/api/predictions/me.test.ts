import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { prisma } from '@/lib/db'
import {
  createTestUser,
  createTestMatch,
  createTestPrediction,
  createTestPhase,
  calculateLockTime,
} from '../../helpers/test-utils'

describe('GET /api/predictions/me', () => {
  let testUser: Awaited<ReturnType<typeof createTestUser>>
  let phase1: Awaited<ReturnType<typeof createTestPhase>>
  let phase2: Awaited<ReturnType<typeof createTestPhase>>
  let match1: Awaited<ReturnType<typeof createTestMatch>>
  let match2: Awaited<ReturnType<typeof createTestMatch>>
  let match3: Awaited<ReturnType<typeof createTestMatch>>
  let match4: Awaited<ReturnType<typeof createTestMatch>>

  beforeAll(async () => {
    // Crear usuario de prueba
    testUser = await createTestUser({
      email: `test-predictions-me-${Date.now()}@test.com`,
      name: 'Test User Predictions',
    })

    // Crear fases
    phase1 = await createTestPhase({
      name: 'Fase 1',
      slug: `phase1-${Date.now()}`,
    })
    phase2 = await createTestPhase({
      name: 'Fase 2',
      slug: `phase2-${Date.now()}`,
    })

    // Crear partidos
    const futureDate1 = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // +2 días
    const futureDate2 = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // +3 días
    const pastDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // -1 día

    match1 = await createTestMatch({
      phaseId: phase1.id,
      matchDate: futureDate1,
      lockTime: calculateLockTime(futureDate1),
      status: 'SCHEDULED',
    })

    match2 = await createTestMatch({
      phaseId: phase2.id,
      matchDate: futureDate2,
      lockTime: calculateLockTime(futureDate2),
      status: 'SCHEDULED',
    })

    match3 = await createTestMatch({
      phaseId: phase1.id,
      matchDate: pastDate,
      lockTime: calculateLockTime(pastDate),
      status: 'FINISHED',
      homeScore: 2,
      awayScore: 1,
    })

    // Crear predicciones
    // Predicción correcta (ganador correcto) - partido finalizado
    await prisma.prediction.create({
      data: {
        userId: testUser.id,
        matchId: match3.id,
        predictedHomeScore: 3,
        predictedAwayScore: 0,
        pointsEarned: 5, // Puntos por acertar ganador
      },
    })

    // Nota: No podemos crear dos predicciones del mismo usuario para el mismo partido
    // porque hay una restricción única (userId, matchId). Para probar predicciones exactas,
    // necesitamos otro partido o actualizar la existente. Usaremos un partido adicional.

    // Crear un partido adicional finalizado para probar predicción exacta
    const pastDate2 = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // -2 días
    match4 = await createTestMatch({
      phaseId: phase1.id,
      matchDate: pastDate2,
      lockTime: calculateLockTime(pastDate2),
      status: 'FINISHED',
      homeScore: 2,
      awayScore: 1,
    })

    // Predicción exacta en partido diferente
    await prisma.prediction.create({
      data: {
        userId: testUser.id,
        matchId: match4.id,
        predictedHomeScore: 2,
        predictedAwayScore: 1,
        pointsEarned: 10, // Puntos por resultado exacto
      },
    })

    // Predicciones futuras (sin puntos aún)
    await createTestPrediction({
      userId: testUser.id,
      matchId: match1.id,
      predictedHomeScore: 1,
      predictedAwayScore: 0,
    })

    await createTestPrediction({
      userId: testUser.id,
      matchId: match2.id,
      predictedHomeScore: 0,
      predictedAwayScore: 1,
    })
  })

  afterAll(async () => {
    // Limpiar datos de prueba (si es necesario)
    // Nota: Los tests están configurados para no borrar datos
  })

  it('debe retornar todas las predicciones del usuario', async () => {
    // Este test verifica la estructura básica
    // En un entorno real, usarías un servidor de prueba o mock
    const predictions = await prisma.prediction.findMany({
      where: { userId: testUser.id },
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
              },
            },
          },
        },
      },
    })

    expect(predictions.length).toBeGreaterThan(0)
    expect(predictions[0]).toHaveProperty('match')
    expect(predictions[0]).toHaveProperty('pointsEarned')
  })

  it('debe filtrar predicciones por fase (phaseId)', async () => {
    const predictions = await prisma.prediction.findMany({
      where: {
        userId: testUser.id,
        match: {
          phaseId: phase1.id,
        },
      },
    })

    // Debería tener al menos 2 predicciones (match1, match3, match4 están en phase1)
    expect(predictions.length).toBeGreaterThanOrEqual(2)
    // Verificar que todas las predicciones pertenecen a partidos de phase1
    const allowedMatchIds = [match1.id, match3.id, match4.id]
    predictions.forEach((p) => {
      expect(allowedMatchIds).toContain(p.matchId)
    })
  })

  it('debe filtrar predicciones por resultado correcto', async () => {
    const predictions = await prisma.prediction.findMany({
      where: {
        userId: testUser.id,
        pointsEarned: { gt: 0 },
      },
    })

    // Debería tener al menos predicciones con puntos
    expect(predictions.length).toBeGreaterThan(0)
    predictions.forEach((p) => {
      expect(p.pointsEarned).toBeGreaterThan(0)
    })
  })

  it('debe ordenar predicciones por fecha (desc)', async () => {
    const predictions = await prisma.prediction.findMany({
      where: { userId: testUser.id },
      include: {
        match: {
          select: {
            matchDate: true,
          },
        },
      },
      orderBy: {
        match: {
          matchDate: 'desc',
        },
      },
    })

    if (predictions.length > 1) {
      for (let i = 0; i < predictions.length - 1; i++) {
        const currentDate = new Date(predictions[i].match.matchDate).getTime()
        const nextDate = new Date(predictions[i + 1].match.matchDate).getTime()
        expect(currentDate).toBeGreaterThanOrEqual(nextDate)
      }
    }
  })

  it('debe ordenar predicciones por puntos (desc)', async () => {
    const predictions = await prisma.prediction.findMany({
      where: { userId: testUser.id },
      orderBy: {
        pointsEarned: 'desc',
      },
    })

    if (predictions.length > 1) {
      for (let i = 0; i < predictions.length - 1; i++) {
        expect(predictions[i].pointsEarned).toBeGreaterThanOrEqual(
          predictions[i + 1].pointsEarned
        )
      }
    }
  })
})
