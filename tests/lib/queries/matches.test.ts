import { describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '@/lib/db'
import {
  getMatches,
  getMatchById,
  getTodayMatches,
  getUpcomingMatches,
} from '@/lib/queries/matches'
import { createTestUser } from '../../helpers/test-utils'

describe('Match Queries', () => {
  describe('getMatches', () => {
    it('debería obtener partidos con paginación', async () => {
      const result = await getMatches({ page: 1, limit: 10 })

      expect(result).toHaveProperty('matches')
      expect(result).toHaveProperty('pagination')
      expect(result.pagination.page).toBe(1)
      expect(result.pagination.limit).toBe(10)
      expect(Array.isArray(result.matches)).toBe(true)
    })

    it('debería filtrar por status', async () => {
      const result = await getMatches({ status: 'SCHEDULED', limit: 5 })

      expect(result.matches.length).toBeLessThanOrEqual(5)
      result.matches.forEach((match) => {
        expect(match.status).toBe('SCHEDULED')
      })
    })

    it('debería incluir equipos y fase', async () => {
      const result = await getMatches({ limit: 1 })

      if (result.matches.length > 0) {
        const match = result.matches[0]
        expect(match.homeTeam).toBeDefined()
        expect(match.awayTeam).toBeDefined()
        expect(match.phase).toBeDefined()
        expect(match.homeTeam.name).toBeDefined()
        expect(match.awayTeam.name).toBeDefined()
        expect(match.phase.name).toBeDefined()
      }
    })

    it('debería incluir predicción del usuario si está autenticado', async () => {
      // Este test requiere crear un usuario y una predicción
      const user = await createTestUser()

      const result = await getMatches({ userId: user.id, limit: 1 })

      expect(result.matches).toBeDefined()
      // Si hay partidos, verificar que tenga el campo predictions
      if (result.matches.length > 0) {
        expect(result.matches[0]).toHaveProperty('predictions')
      }
    })

    it('debería calcular paginación correctamente', async () => {
      const result = await getMatches({ page: 1, limit: 5 })

      expect(result.pagination.totalPages).toBe(
        Math.ceil(result.pagination.total / 5)
      )
      expect(result.pagination.hasMore).toBe(
        result.pagination.page * 5 < result.pagination.total
      )
    })
  })

  describe('getMatchById', () => {
    it('debería obtener un partido por ID', async () => {
      // Obtener un partido existente
      const matches = await prisma.match.findMany({ take: 1 })

      if (matches.length > 0) {
        const matchId = matches[0].id
        const match = await getMatchById(matchId)

        expect(match).toBeDefined()
        expect(match?.id).toBe(matchId)
        expect(match?.homeTeam).toBeDefined()
        expect(match?.awayTeam).toBeDefined()
      }
    })

    it('debería retornar null para ID inexistente', async () => {
      const match = await getMatchById('00000000-0000-0000-0000-000000000000')
      expect(match).toBeNull()
    })

    it('debería incluir predicción del usuario', async () => {
      const user = await createTestUser()
      const matches = await prisma.match.findMany({ take: 1 })

      if (matches.length > 0) {
        const match = await getMatchById(matches[0].id, user.id)
        expect(match).toHaveProperty('predictions')
      }
    })
  })

  describe('getTodayMatches', () => {
    it('debería obtener solo partidos de hoy', async () => {
      const result = await getTodayMatches()

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      result.matches.forEach((match) => {
        const matchDate = new Date(match.matchDate)
        expect(matchDate >= today).toBe(true)
        expect(matchDate < tomorrow).toBe(true)
      })
    })
  })

  describe('getUpcomingMatches', () => {
    it('debería obtener solo partidos futuros', async () => {
      const result = await getUpcomingMatches(undefined, 10)

      const now = new Date()
      result.matches.forEach((match) => {
        expect(match.status).toBe('SCHEDULED')
        expect(new Date(match.matchDate) >= now).toBe(true)
      })
    })

    it('debería respetar el límite especificado', async () => {
      const limit = 3
      const result = await getUpcomingMatches(undefined, limit)

      expect(result.matches.length).toBeLessThanOrEqual(limit)
    })
  })
})
