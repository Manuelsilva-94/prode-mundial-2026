import { describe, it, expect } from 'vitest'
import { matchFiltersSchema } from '@/lib/validations/match'

describe('Match Validations', () => {
  describe('matchFiltersSchema', () => {
    it('debería validar filtros correctos', () => {
      const validFilters = {
        status: 'SCHEDULED',
        page: 1,
        limit: 20,
      }

      const result = matchFiltersSchema.parse(validFilters)
      expect(result.status).toBe('SCHEDULED')
      expect(result.page).toBe(1)
      expect(result.limit).toBe(20)
    })

    it('debería usar valores por defecto', () => {
      const result = matchFiltersSchema.parse({})
      expect(result.page).toBe(1)
      expect(result.limit).toBe(20)
    })

    it('debería rechazar status inválido', () => {
      expect(() => matchFiltersSchema.parse({ status: 'INVALID' })).toThrow()
    })

    it('debería rechazar límite mayor a 50', () => {
      expect(() => matchFiltersSchema.parse({ limit: 51 })).toThrow()
    })

    it('debería rechazar página 0 o negativa', () => {
      expect(() => matchFiltersSchema.parse({ page: 0 })).toThrow()

      expect(() => matchFiltersSchema.parse({ page: -1 })).toThrow()
    })

    it('debería convertir strings a números', () => {
      const result = matchFiltersSchema.parse({
        page: '2',
        limit: '15',
      } as any)

      expect(result.page).toBe(2)
      expect(result.limit).toBe(15)
      expect(typeof result.page).toBe('number')
      expect(typeof result.limit).toBe('number')
    })

    it('debería validar fechas ISO', () => {
      const result = matchFiltersSchema.parse({
        dateFrom: '2026-06-11T00:00:00Z',
        dateTo: '2026-06-15T23:59:59Z',
      })

      expect(result.dateFrom).toBe('2026-06-11T00:00:00Z')
      expect(result.dateTo).toBe('2026-06-15T23:59:59Z')
    })
  })
})
