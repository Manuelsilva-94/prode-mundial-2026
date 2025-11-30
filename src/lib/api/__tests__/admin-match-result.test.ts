// src/lib/api/__tests__/admin-match-result.test.ts
import { describe, it, expect } from 'vitest'
import { updateMatchResultSchema } from '@/lib/validations/match'

describe('Admin Match Result - Validations', () => {
  describe('updateMatchResultSchema', () => {
    it('debe validar scores correctos', () => {
      const result = updateMatchResultSchema.parse({
        homeScore: 2,
        awayScore: 1,
      })

      expect(result.homeScore).toBe(2)
      expect(result.awayScore).toBe(1)
    })

    it('debe rechazar scores negativos', () => {
      expect(() =>
        updateMatchResultSchema.parse({
          homeScore: -1,
          awayScore: 2,
        })
      ).toThrow()
    })

    it('debe rechazar scores no enteros', () => {
      expect(() =>
        updateMatchResultSchema.parse({
          homeScore: 2.5,
          awayScore: 1,
        })
      ).toThrow()
    })

    it('debe aceptar empate 0-0', () => {
      const result = updateMatchResultSchema.parse({
        homeScore: 0,
        awayScore: 0,
      })

      expect(result.homeScore).toBe(0)
      expect(result.awayScore).toBe(0)
    })
  })

  describe('validateMatchResultUpdate', () => {
    it('debe permitir cargar resultado en partido SCHEDULED', async () => {
      // Mock de un partido SCHEDULED
      // Este test requiere mock de prisma
      // Lo implementarías cuando tengas el setup de testing completo
    })

    it('debe rechazar partido FINISHED', async () => {
      // Mock de un partido FINISHED
    })

    it('debe rechazar partido POSTPONED', async () => {
      // Mock de un partido POSTPONED
    })

    it('debe retornar error si partido no existe', async () => {
      // Mock de partido no encontrado
    })
  })
})
