import { describe, it, expect } from 'vitest'
import { prisma } from '@/lib/db'

describe('GET /api/matches', () => {
  it('debería retornar lista de partidos', async () => {
    const matches = await prisma.match.findMany({ take: 5 })
    expect(Array.isArray(matches)).toBe(true)
  })

  it('debería incluir información de equipos', async () => {
    const match = await prisma.match.findFirst({
      include: {
        homeTeam: true,
        awayTeam: true,
      },
    })

    if (match) {
      expect(match.homeTeam).toBeDefined()
      expect(match.awayTeam).toBeDefined()
      expect(match.homeTeam.name).toBeDefined()
      expect(match.awayTeam.name).toBeDefined()
    }
  })

  it('debería filtrar por status', async () => {
    const scheduledMatches = await prisma.match.findMany({
      where: { status: 'SCHEDULED' },
      take: 5,
    })

    scheduledMatches.forEach((match) => {
      expect(match.status).toBe('SCHEDULED')
    })
  })
})
