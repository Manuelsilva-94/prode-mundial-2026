// lib/scoring/__tests__/calculator.test.ts
import { describe, it, expect } from 'vitest'
import { calculatePoints } from '../calculator'

describe('calculatePoints - Sistema de Puntuación Oficial', () => {
  // ============================================
  // CASO 1: RESULTADO EXACTO = 12 PUNTOS
  // ============================================
  describe('Resultado Exacto (12 puntos)', () => {
    it('debe otorgar 12 puntos por resultado exacto 1-0', () => {
      const result = calculatePoints(1, 0, 1, 0, 'grupos')

      expect(result.total).toBe(12)
      expect(result.basePoints).toBe(12)
      expect(result.breakdown.exactScore).toBe(12)
    })

    it('debe otorgar 12 puntos por resultado exacto 3-1', () => {
      const result = calculatePoints(3, 1, 3, 1, 'grupos')

      expect(result.total).toBe(12)
      expect(result.breakdown.exactScore).toBe(12)
    })

    it('debe otorgar 12 puntos por empate exacto 1-1', () => {
      const result = calculatePoints(1, 1, 1, 1, 'grupos')

      expect(result.total).toBe(12)
      expect(result.breakdown.exactScore).toBe(12)
    })

    it('debe otorgar 12 puntos por empate 0-0', () => {
      const result = calculatePoints(0, 0, 0, 0, 'grupos')

      expect(result.total).toBe(12)
      expect(result.breakdown.exactScore).toBe(12)
    })
  })

  // ============================================
  // CASO 2: GANADOR + GOLES DE 1 EQUIPO = 7 PUNTOS
  // ============================================
  describe('Ganador + Goles de 1 Equipo (7 puntos)', () => {
    it('predicción 1-0, resultado 2-0 → 7 puntos (ganador + goles local)', () => {
      const result = calculatePoints(1, 0, 2, 0, 'grupos')

      expect(result.total).toBe(7)
      expect(result.breakdown.correctWinnerPlusOneTeamScore).toBe(7)
    })

    it('predicción 3-1, resultado 3-2 → 7 puntos (ganador + goles local)', () => {
      const result = calculatePoints(3, 1, 3, 2, 'grupos')

      expect(result.total).toBe(7)
      expect(result.breakdown.correctWinnerPlusOneTeamScore).toBe(7)
    })

    it('predicción 2-1, resultado 3-1 → 7 puntos (ganador + goles visitante)', () => {
      const result = calculatePoints(2, 1, 3, 1, 'grupos')

      expect(result.total).toBe(7)
      expect(result.breakdown.correctWinnerPlusOneTeamScore).toBe(7)
    })

    it('predicción 1-1, resultado 2-2 → 5 puntos (solo empate, sin bonificación por goles)', () => {
      const result = calculatePoints(1, 1, 2, 2, 'grupos')

      expect(result.total).toBe(5)
      expect(result.breakdown.correctWinnerOrDraw).toBe(5)
    })
  })

  // ============================================
  // CASO 3: SOLO GANADOR O EMPATE = 5 PUNTOS
  // ============================================
  describe('Solo Ganador o Empate (5 puntos)', () => {
    it('predicción 1-0, resultado 2-1 → 5 puntos (solo ganador)', () => {
      const result = calculatePoints(1, 0, 2, 1, 'grupos')

      expect(result.total).toBe(5)
      expect(result.breakdown.correctWinnerOrDraw).toBe(5)
    })

    it('predicción 2-1, resultado 3-0 → 5 puntos (solo ganador)', () => {
      const result = calculatePoints(2, 1, 3, 0, 'grupos')

      expect(result.total).toBe(5)
      expect(result.breakdown.correctWinnerOrDraw).toBe(5)
    })

    it('predicción 1-1, resultado 3-3 → 5 puntos (solo empate)', () => {
      const result = calculatePoints(1, 1, 3, 3, 'grupos')

      expect(result.total).toBe(5)
      expect(result.breakdown.correctWinnerOrDraw).toBe(5)
    })

    it('predicción 0-2, resultado 1-3 → 5 puntos (ganador visitante)', () => {
      const result = calculatePoints(0, 2, 1, 3, 'grupos')

      expect(result.total).toBe(5)
      expect(result.breakdown.correctWinnerOrDraw).toBe(5)
    })
  })

  // ============================================
  // CASO 4: SOLO GOLES DE 1 EQUIPO = 2 PUNTOS
  // ============================================
  describe('Solo Goles de 1 Equipo (2 puntos)', () => {
    it('predicción 1-0, resultado 0-0 → 2 puntos (solo goles visitante)', () => {
      const result = calculatePoints(1, 0, 0, 0, 'grupos')

      expect(result.total).toBe(2)
      expect(result.breakdown.correctOneTeamScore).toBe(2)
    })

    it('predicción 2-1, resultado 2-2 → 2 puntos (solo goles local)', () => {
      const result = calculatePoints(2, 1, 2, 2, 'grupos')

      expect(result.total).toBe(2)
      expect(result.breakdown.correctOneTeamScore).toBe(2)
    })

    it('predicción 1-2, resultado 0-2 → 7 puntos (ganador + goles visitante)', () => {
      const result = calculatePoints(1, 2, 0, 2, 'grupos')

      expect(result.total).toBe(7)
      expect(result.breakdown.correctWinnerPlusOneTeamScore).toBe(7)
    })
  })

  // ============================================
  // CASO 5: TODO INCORRECTO = 0 PUNTOS
  // ============================================
  describe('Todo Incorrecto (0 puntos)', () => {
    it('predicción 1-0, resultado 2-2 → 0 puntos', () => {
      const result = calculatePoints(1, 0, 2, 2, 'grupos')

      expect(result.total).toBe(0)
      expect(result.breakdown).toEqual({})
    })

    it('predicción 2-1, resultado 1-3 → 0 puntos', () => {
      const result = calculatePoints(2, 1, 1, 3, 'grupos')

      expect(result.total).toBe(0)
      expect(result.breakdown).toEqual({})
    })

    it('predicción 3-0, resultado 0-3 → 0 puntos (resultado inverso)', () => {
      const result = calculatePoints(3, 0, 0, 3, 'grupos')

      expect(result.total).toBe(0)
      expect(result.breakdown).toEqual({})
    })

    it('predicción 0-2, resultado 3-1 → 0 puntos', () => {
      const result = calculatePoints(0, 2, 3, 1, 'grupos')

      expect(result.total).toBe(0)
      expect(result.breakdown).toEqual({})
    })
  })

  // ============================================
  // CASO 6: CASOS ESPECIALES Y EDGE CASES
  // ============================================
  describe('Casos Especiales', () => {
    it('debe manejar goleadas - predicción 5-0, resultado 5-0 → 12 puntos', () => {
      const result = calculatePoints(5, 0, 5, 0, 'grupos')

      expect(result.total).toBe(12)
      expect(result.breakdown.exactScore).toBe(12)
    })

    it('debe manejar goleadas con diferente marcador - predicción 3-0, resultado 5-0 → 7 puntos', () => {
      const result = calculatePoints(3, 0, 5, 0, 'grupos')

      expect(result.total).toBe(7)
      expect(result.breakdown.correctWinnerPlusOneTeamScore).toBe(7)
    })

    it('debe manejar empates con goles - predicción 2-2, resultado 3-3 → 5 puntos', () => {
      const result = calculatePoints(2, 2, 3, 3, 'grupos')

      expect(result.total).toBe(5)
      expect(result.breakdown.correctWinnerOrDraw).toBe(5)
    })
  })

  // ============================================
  // CASO 7: VERIFICAR CONTEXTO
  // ============================================
  describe('Contexto en Breakdown', () => {
    it('debe incluir información contextual completa', () => {
      const result = calculatePoints(2, 1, 3, 0, 'grupos')

      expect(result.context).toEqual({
        predicted: { home: 2, away: 1 },
        actual: { home: 3, away: 0 },
        phase: 'grupos',
      })
    })
  })

  // ============================================
  // CASO 8: MULTIPLICADORES (TODOS = 1.0 SEGÚN REGLAS)
  // ============================================
  describe('Multiplicadores de Fase (todos 1.0)', () => {
    it('Grupos: multiplicador 1.0', () => {
      const result = calculatePoints(1, 0, 1, 0, 'grupos')
      expect(result.multiplier).toBe(1.0)
      expect(result.total).toBe(12)
    })

    it('Final: multiplicador 1.0 (sin bonificación)', () => {
      const result = calculatePoints(1, 0, 1, 0, 'final')
      expect(result.multiplier).toBe(1.0)
      expect(result.total).toBe(12)
    })

    it('Octavos: multiplicador 1.0', () => {
      const result = calculatePoints(2, 1, 2, 1, 'octavos')
      expect(result.multiplier).toBe(1.0)
      expect(result.total).toBe(12)
    })

    it('Semifinales: multiplicador 1.0', () => {
      const result = calculatePoints(1, 0, 2, 0, 'semifinales')
      expect(result.multiplier).toBe(1.0)
      expect(result.total).toBe(7)
    })
  })

  // ============================================
  // CASO 9: CASOS ADICIONALES DE EMPATE
  // ============================================
  describe('Casos Adicionales de Empate', () => {
    it('predicción 0-0, resultado 1-1 → 5 puntos (acertó empate)', () => {
      const result = calculatePoints(0, 0, 1, 1, 'grupos')
      expect(result.total).toBe(5)
      expect(result.breakdown.correctWinnerOrDraw).toBe(5)
    })

    it('predicción 2-2, resultado 4-4 → 5 puntos (solo empate)', () => {
      const result = calculatePoints(2, 2, 4, 4, 'grupos')
      expect(result.total).toBe(5)
      expect(result.breakdown.correctWinnerOrDraw).toBe(5)
    })

    it('predicción 1-1, resultado 0-0 → 2 puntos (solo goles visitante en empate real)', () => {
      const result = calculatePoints(1, 1, 0, 0, 'grupos')
      expect(result.total).toBe(2)
      expect(result.breakdown.correctOneTeamScore).toBe(2)
    })

    it('predicción 3-3, resultado 0-0 → 5 puntos (acertó empate pero no marcador)', () => {
      const result = calculatePoints(3, 3, 0, 0, 'grupos')
      // Espera: acertó empate (0-0 es empate)
      expect(result.total).toBe(5)
      expect(result.breakdown.correctWinnerOrDraw).toBe(5)
    })
  })

  // ============================================
  // CASO 10: CASOS ADICIONALES DE GANADOR VISITANTE
  // ============================================
  describe('Casos Adicionales - Ganador Visitante', () => {
    it('predicción 0-1, resultado 0-1 → 12 puntos (exacto visitante)', () => {
      const result = calculatePoints(0, 1, 0, 1, 'grupos')
      expect(result.total).toBe(12)
      expect(result.breakdown.exactScore).toBe(12)
    })

    it('predicción 1-2, resultado 0-2 → 7 puntos (ganador visitante + goles visitante)', () => {
      const result = calculatePoints(1, 2, 0, 2, 'grupos')
      expect(result.total).toBe(7)
      expect(result.breakdown.correctWinnerPlusOneTeamScore).toBe(7)
    })

    it('predicción 2-3, resultado 1-4 → 5 puntos (solo ganador visitante)', () => {
      const result = calculatePoints(2, 3, 1, 4, 'grupos')
      expect(result.total).toBe(5)
      expect(result.breakdown.correctWinnerOrDraw).toBe(5)
    })

    it('predicción 0-3, resultado 2-3 → 7 puntos (ganador visitante + goles visitante)', () => {
      const result = calculatePoints(0, 3, 2, 3, 'grupos')
      expect(result.total).toBe(7)
      expect(result.breakdown.correctWinnerPlusOneTeamScore).toBe(7)
    })
  })

  // ============================================
  // CASO 11: CASOS ADICIONALES DE GOLES PARCIALES
  // ============================================
  describe('Casos Adicionales - Goles Parciales', () => {
    it('predicción 4-0, resultado 4-3 → 7 puntos (ganador + goles local)', () => {
      const result = calculatePoints(4, 0, 4, 3, 'grupos')
      expect(result.total).toBe(7)
      expect(result.breakdown.correctWinnerPlusOneTeamScore).toBe(7)
    })

    it('predicción 1-3, resultado 0-3 → 7 puntos (ganador visitante + goles visitante)', () => {
      const result = calculatePoints(1, 3, 0, 3, 'grupos')
      expect(result.total).toBe(7)
      expect(result.breakdown.correctWinnerPlusOneTeamScore).toBe(7)
    })

    it('predicción 2-4, resultado 1-4 → 7 puntos (ganador visitante + goles visitante)', () => {
      const result = calculatePoints(2, 4, 1, 4, 'grupos')
      expect(result.total).toBe(7)
      expect(result.breakdown.correctWinnerPlusOneTeamScore).toBe(7)
    })
  })
})

/*
┌──────────────────────────────────────────────────────────────────┐
│ TABLA DE PUNTUACIÓN - REGLAS OFICIALES                          │
├────────────────┬──────────────┬─────────────────────────────────┤
│ Predicción     │ Resultado    │ Puntos │ Motivo                 │
├────────────────┼──────────────┼────────┼────────────────────────┤
│ 1 - 0          │ 1 - 0        │   12   │ Resultado exacto       │
│ 1 - 0          │ 2 - 0        │    7   │ Ganador + goles local  │
│ 1 - 0          │ 2 - 1        │    5   │ Solo ganador           │
│ 1 - 0          │ 0 - 0        │    2   │ Solo goles visitante   │
│ 1 - 0          │ 2 - 2        │    0   │ Todo incorrecto        │
│ 3 - 1          │ 3 - 1        │   12   │ Resultado exacto       │
│ 3 - 1          │ 3 - 2        │    7   │ Ganador + goles local  │
│ 2 - 1          │ 3 - 1        │    7   │ Ganador + goles visit  │
│ 1 - 1          │ 2 - 2        │    7   │ Empate + goles (ambos) │
│ 1 - 1          │ 3 - 3        │    5   │ Solo empate            │
│ 2 - 1          │ 2 - 2        │    2   │ Solo goles local       │
└────────────────┴──────────────┴────────┴────────────────────────┘
*/
