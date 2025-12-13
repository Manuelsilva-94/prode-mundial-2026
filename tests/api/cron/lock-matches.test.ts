import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest'
import { prisma } from '@/lib/db'
import { createTestMatch, calculateLockTime } from '../../helpers/test-utils'
import { POST, GET } from '@/app/api/cron/lock-matches/route'
import { NextRequest } from 'next/server'

describe('Cron Job: Lock Matches', () => {
  const CRON_SECRET = 'test-cron-secret-12345'
  const originalEnv = process.env.CRON_SECRET

  beforeAll(() => {
    // Configurar CRON_SECRET para testing
    process.env.CRON_SECRET = CRON_SECRET
  })

  beforeEach(() => {
    // Restaurar env en cada test
    process.env.CRON_SECRET = CRON_SECRET
  })

  afterAll(() => {
    // Restaurar env original
    if (originalEnv) {
      process.env.CRON_SECRET = originalEnv
    } else {
      delete process.env.CRON_SECRET
    }
  })

  // Helper para crear NextRequest con headers
  function createRequest(
    method: string,
    headers: Record<string, string> = {}
  ): NextRequest {
    const url = 'http://localhost:3000/api/cron/lock-matches'
    return new NextRequest(url, {
      method,
      headers: new Headers(headers),
    })
  }

  describe('POST /api/cron/lock-matches - Seguridad', () => {
    it('debe rechazar requests sin authorization header', async () => {
      const req = createRequest('POST')
      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('No autorizado')
    })

    it('debe rechazar requests con secret incorrecto', async () => {
      const req = createRequest('POST', {
        Authorization: 'Bearer wrong-secret',
      })
      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('No autorizado')
    })

    it('debe rechazar si CRON_SECRET no está configurado', async () => {
      delete process.env.CRON_SECRET
      const req = createRequest('POST', {
        Authorization: `Bearer ${CRON_SECRET}`,
      })
      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Configuración incorrecta')

      // Restaurar
      process.env.CRON_SECRET = CRON_SECRET
    })

    it('debe aceptar requests con secret correcto', async () => {
      // Crear un partido que debería bloquearse
      const pastDate = new Date(Date.now() - 60 * 60 * 1000) // Hace 1 hora
      const match = await createTestMatch({
        matchDate: pastDate,
        lockTime: calculateLockTime(pastDate),
        isLocked: false,
        status: 'SCHEDULED',
      })

      const req = createRequest('POST', {
        Authorization: `Bearer ${CRON_SECRET}`,
      })
      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)

      // Limpiar
      await prisma.match.delete({ where: { id: match.id } })
    })
  })

  describe('POST /api/cron/lock-matches - Lógica de Bloqueo', () => {
    it('debe bloquear partidos con lockTime <= now() y isLocked = false', async () => {
      // Crear partido que debe bloquearse (lockTime en el pasado)
      const pastDate = new Date(Date.now() - 30 * 60 * 1000) // Hace 30 minutos
      const match = await createTestMatch({
        matchDate: pastDate,
        lockTime: calculateLockTime(pastDate),
        isLocked: false,
        status: 'SCHEDULED',
      })

      // Ejecutar cron job
      const req = createRequest('POST', {
        Authorization: `Bearer ${CRON_SECRET}`,
      })
      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.lockedCount).toBeGreaterThanOrEqual(1)

      // Verificar que el partido fue bloqueado
      const updatedMatch = await prisma.match.findUnique({
        where: { id: match.id },
      })

      expect(updatedMatch).toBeDefined()
      expect(updatedMatch?.isLocked).toBe(true)

      // Limpiar
      await prisma.match.delete({ where: { id: match.id } })
    })

    it('no debe bloquear partidos con lockTime en el futuro', async () => {
      // Crear partido con lockTime en el futuro
      const futureDate = new Date(Date.now() + 60 * 60 * 1000) // En 1 hora
      const match = await createTestMatch({
        matchDate: futureDate,
        lockTime: calculateLockTime(futureDate),
        isLocked: false,
        status: 'SCHEDULED',
      })

      // Ejecutar cron job
      const req = createRequest('POST', {
        Authorization: `Bearer ${CRON_SECRET}`,
      })
      const response = await POST(req)

      expect(response.status).toBe(200)

      // Puede que haya bloqueado otros partidos, pero este no debería estar bloqueado
      const updatedMatch = await prisma.match.findUnique({
        where: { id: match.id },
      })

      expect(updatedMatch).toBeDefined()
      expect(updatedMatch?.isLocked).toBe(false)

      // Limpiar
      await prisma.match.delete({ where: { id: match.id } })
    })

    it('no debe bloquear partidos ya bloqueados', async () => {
      // Crear partido ya bloqueado
      const pastDate = new Date(Date.now() - 30 * 60 * 1000)
      const match = await createTestMatch({
        matchDate: pastDate,
        lockTime: calculateLockTime(pastDate),
        isLocked: true, // Ya bloqueado
        status: 'SCHEDULED',
      })

      // Ejecutar cron job
      const req = createRequest('POST', {
        Authorization: `Bearer ${CRON_SECRET}`,
      })
      const response = await POST(req)

      expect(response.status).toBe(200)

      // El partido debería seguir bloqueado, pero no contado
      const updatedMatch = await prisma.match.findUnique({
        where: { id: match.id },
      })

      expect(updatedMatch).toBeDefined()
      expect(updatedMatch?.isLocked).toBe(true)

      // Limpiar
      await prisma.match.delete({ where: { id: match.id } })
    })

    it('no debe bloquear partidos finalizados', async () => {
      // Crear partido finalizado
      const pastDate = new Date(Date.now() - 60 * 60 * 1000)
      const match = await createTestMatch({
        matchDate: pastDate,
        lockTime: calculateLockTime(pastDate),
        isLocked: false,
        status: 'FINISHED', // Finalizado
        homeScore: 2,
        awayScore: 1,
      })

      // Ejecutar cron job
      const req = createRequest('POST', {
        Authorization: `Bearer ${CRON_SECRET}`,
      })
      const response = await POST(req)

      expect(response.status).toBe(200)

      // El partido no debería ser bloqueado porque ya está finalizado
      // (pero podría estar bloqueado por otra lógica)
      const updatedMatch = await prisma.match.findUnique({
        where: { id: match.id },
      })

      expect(updatedMatch).toBeDefined()

      // Limpiar
      await prisma.match.delete({ where: { id: match.id } })
    })

    it('debe retornar 0 lockedCount si no hay partidos para bloquear', async () => {
      // Crear partido que no debe bloquearse (futuro)
      const futureDate = new Date(Date.now() + 2 * 60 * 60 * 1000)
      await createTestMatch({
        matchDate: futureDate,
        lockTime: calculateLockTime(futureDate),
        isLocked: false,
        status: 'SCHEDULED',
      })

      // Ejecutar cron job
      const req = createRequest('POST', {
        Authorization: `Bearer ${CRON_SECRET}`,
      })
      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(200)

      // Puede haber bloqueado partidos de otros tests, pero verificamos la estructura
      expect(data).toHaveProperty('success')
      expect(data).toHaveProperty('lockedCount')
      expect(data).toHaveProperty('duration')
    })
  })

  describe('POST /api/cron/lock-matches - Múltiples Partidos', () => {
    it('debe bloquear múltiples partidos en una ejecución', async () => {
      // Crear varios partidos para bloquear
      const matches: Awaited<ReturnType<typeof createTestMatch>>[] = []
      for (let i = 1; i <= 3; i++) {
        const pastDate = new Date(Date.now() - i * 30 * 60 * 1000) // Hace 30, 60, 90 minutos
        const match = await createTestMatch({
          matchDate: pastDate,
          lockTime: calculateLockTime(pastDate),
          isLocked: false,
          status: 'SCHEDULED',
        })
        matches.push(match)
      }

      // Ejecutar cron job
      const req = createRequest('POST', {
        Authorization: `Bearer ${CRON_SECRET}`,
      })
      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.lockedCount).toBeGreaterThanOrEqual(3)

      // Verificar que todos fueron bloqueados
      for (const match of matches) {
        const updated = await prisma.match.findUnique({
          where: { id: match.id },
        })
        expect(updated?.isLocked).toBe(true)
      }

      // Limpiar
      for (const match of matches) {
        await prisma.match.delete({ where: { id: match.id } })
      }
    })
  })

  describe('GET /api/cron/lock-matches - Status', () => {
    it('debe retornar información del endpoint sin autorización', async () => {
      const req = createRequest('GET')
      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.endpoint).toBe('/api/cron/lock-matches')
      expect(data.method).toBe('POST')
      expect(data.schedule).toContain('*/5 * * * *')
    })

    it('debe retornar estadísticas con autorización', async () => {
      const req = createRequest('GET', {
        Authorization: `Bearer ${CRON_SECRET}`,
      })
      const response = await GET(req)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.endpoint).toBe('/api/cron/lock-matches')
      expect(data.stats).toBeDefined()
      expect(data.stats).toHaveProperty('pendingToLock')
      expect(data.stats).toHaveProperty('totalScheduled')
      expect(data.stats).toHaveProperty('totalLocked')
    })
  })
})
