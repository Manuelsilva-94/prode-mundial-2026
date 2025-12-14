// lib/scoring/rules.ts
/**
 * REGLAS DE PUNTUACIÓN - PRODE MUNDIAL 2026
 *
 * Sistema de puntos basado en las reglas oficiales del prode
 */

export interface ScoringRules {
  // Puntos por resultado exacto (ej: 3-1 predicho, 3-1 real)
  EXACT_SCORE: number

  // Puntos por acertar ganador o empate
  CORRECT_WINNER_OR_DRAW: number

  // Puntos por acertar goles de UN equipo (cuando también acertó ganador)
  CORRECT_WINNER_PLUS_ONE_TEAM_SCORE: number

  // Puntos por acertar goles de un equipo (sin acertar ganador)
  CORRECT_ONE_TEAM_SCORE: number
}

/**
 * REGLAS BASE DE PUNTUACIÓN
 */
export const BASE_SCORING_RULES: ScoringRules = {
  EXACT_SCORE: 12, // Resultado exacto
  CORRECT_WINNER_OR_DRAW: 5, // Solo ganador o empate
  CORRECT_WINNER_PLUS_ONE_TEAM_SCORE: 7, // Ganador + goles de 1 equipo
  CORRECT_ONE_TEAM_SCORE: 2, // Solo goles de 1 equipo
}

/**
 * MULTIPLICADORES POR FASE DEL TORNEO
 * NO APLICAN SEGÚN LAS REGLAS MOSTRADAS
 * Todos tienen multiplicador 1.0
 */
export const PHASE_MULTIPLIERS: Record<string, number> = {
  grupos: 1.0,
  dieciseisavos: 1.0,
  octavos: 1.0,
  cuartos: 1.0,
  semifinales: 1.0,
  'tercer-lugar': 1.0,
  final: 1.0,
}

/**
 * Obtiene el multiplicador de una fase
 */
export function getPhaseMultiplier(phaseSlug: string): number {
  return PHASE_MULTIPLIERS[phaseSlug] || 1.0
}

/**
 * Interface para el breakdown detallado de puntos
 */
export interface PointsBreakdown {
  total: number
  basePoints: number
  multiplier: number

  breakdown: {
    exactScore?: number
    correctWinnerOrDraw?: number
    correctWinnerPlusOneTeamScore?: number
    correctOneTeamScore?: number
  }

  context: {
    predicted: {
      home: number
      away: number
    }
    actual: {
      home: number
      away: number
    }
    phase: string
  }
}

/**
 * TABLA DE EJEMPLOS SEGÚN REGLAS
 *
 * Predicción 1-0, Resultado 1-0 → 12 puntos (exacto)
 * Predicción 1-0, Resultado 2-0 → 7 puntos (ganador + goles local)
 * Predicción 1-0, Resultado 2-1 → 5 puntos (solo ganador)
 * Predicción 1-0, Resultado 0-0 → 2 puntos (solo goles visitante: 0)
 * Predicción 1-0, Resultado 2-2 → 0 puntos (todo incorrecto)
 */
