// lib/scoring/calculator.ts
import {
  BASE_SCORING_RULES,
  getPhaseMultiplier,
  PointsBreakdown,
  ScoringRules,
} from './rules'

/**
 * FUNCIÓN PRINCIPAL DE CÁLCULO DE PUNTOS
 * Basado en las reglas oficiales del prode
 */
export function calculatePoints(
  predictedHome: number,
  predictedAway: number,
  actualHome: number,
  actualAway: number,
  phaseSlug: string,
  customRules?: ScoringRules
): PointsBreakdown {
  const rules = customRules || BASE_SCORING_RULES
  const breakdown: PointsBreakdown['breakdown'] = {}
  let basePoints = 0

  // ============================================
  // 1. VERIFICAR RESULTADO EXACTO
  // ============================================
  if (predictedHome === actualHome && predictedAway === actualAway) {
    breakdown.exactScore = rules.EXACT_SCORE
    basePoints = rules.EXACT_SCORE
  }
  // ============================================
  // 2. NO ES EXACTO - VERIFICAR OTRAS REGLAS
  // ============================================
  else {
    const predictedResult = getMatchResult(predictedHome, predictedAway)
    const actualResult = getMatchResult(actualHome, actualAway)

    const predictedHomeCorrect = predictedHome === actualHome
    const predictedAwayCorrect = predictedAway === actualAway

    // REGLA ESPECIAL: Si el resultado real es EMPATE
    // Solo puede dar 5 puntos (acertó empate) o 0 puntos (no acertó empate)
    // NUNCA 7 o 2 puntos cuando hay empate real
    // REGLA ESPECIAL: Si el resultado real es EMPATE
    if (actualResult === 'DRAW') {
      if (predictedResult === 'DRAW') {
        // Acertó que hay empate (pero no el marcador exacto)
        breakdown.correctWinnerOrDraw = rules.CORRECT_WINNER_OR_DRAW
        basePoints = rules.CORRECT_WINNER_OR_DRAW
      } else {
        // No acertó el empate, pero verificar si acertó goles de un equipo
        if (predictedHomeCorrect || predictedAwayCorrect) {
          breakdown.correctOneTeamScore = rules.CORRECT_ONE_TEAM_SCORE
          basePoints = rules.CORRECT_ONE_TEAM_SCORE
        } else {
          // No acertó nada
          basePoints = 0
        }
      }
    }
    // REGLA NORMAL: Resultado NO es empate
    else {
      // 2.1 - Acertó ganador
      if (predictedResult === actualResult) {
        // 2.1.1 - Ganador + goles de 1 equipo correcto
        if (predictedHomeCorrect || predictedAwayCorrect) {
          breakdown.correctWinnerPlusOneTeamScore =
            rules.CORRECT_WINNER_PLUS_ONE_TEAM_SCORE
          basePoints = rules.CORRECT_WINNER_PLUS_ONE_TEAM_SCORE
        }
        // 2.1.2 - Solo ganador (sin goles correctos)
        else {
          breakdown.correctWinnerOrDraw = rules.CORRECT_WINNER_OR_DRAW
          basePoints = rules.CORRECT_WINNER_OR_DRAW
        }
      }
      // 2.2 - NO acertó ganador
      else {
        // 2.2.1 - Solo goles de 1 equipo correcto
        if (predictedHomeCorrect || predictedAwayCorrect) {
          breakdown.correctOneTeamScore = rules.CORRECT_ONE_TEAM_SCORE
          basePoints = rules.CORRECT_ONE_TEAM_SCORE
        }
        // 2.2.2 - Todo incorrecto
        else {
          basePoints = 0
        }
      }
    }
  }

  // ============================================
  // 3. APLICAR MULTIPLICADOR DE FASE
  // ============================================
  const multiplier = getPhaseMultiplier(phaseSlug)
  const totalPoints = Math.round(basePoints * multiplier)

  // ============================================
  // 4. RETORNAR BREAKDOWN COMPLETO
  // ============================================
  return {
    total: totalPoints,
    basePoints,
    multiplier,
    breakdown,
    context: {
      predicted: {
        home: predictedHome,
        away: predictedAway,
      },
      actual: {
        home: actualHome,
        away: actualAway,
      },
      phase: phaseSlug,
    },
  }
}

/**
 * Determina el resultado de un partido
 */
function getMatchResult(
  homeScore: number,
  awayScore: number
): 'HOME_WIN' | 'AWAY_WIN' | 'DRAW' {
  if (homeScore > awayScore) return 'HOME_WIN'
  if (awayScore > homeScore) return 'AWAY_WIN'
  return 'DRAW'
}

/**
 * FUNCIÓN HELPER: Calcula puntos de múltiples predicciones
 */
export function calculatePointsBatch(
  predictions: Array<{
    predictedHome: number
    predictedAway: number
    actualHome: number
    actualAway: number
    phaseSlug: string
  }>
): PointsBreakdown[] {
  return predictions.map((pred) =>
    calculatePoints(
      pred.predictedHome,
      pred.predictedAway,
      pred.actualHome,
      pred.actualAway,
      pred.phaseSlug
    )
  )
}

/**
 * FUNCIÓN HELPER: Valida que los scores sean válidos
 */
export function validateScores(
  home: number | null,
  away: number | null
): boolean {
  if (home === null || away === null) return false
  if (home < 0 || away < 0) return false
  if (!Number.isInteger(home) || !Number.isInteger(away)) return false
  return true
}

/**
 * EJEMPLOS SEGÚN REGLAS OFICIALES:
 *
 * calculatePoints(1, 0, 1, 0, 'grupos') → 12 puntos (exacto)
 * calculatePoints(1, 0, 2, 0, 'grupos') → 7 puntos (ganador + goles local)
 * calculatePoints(1, 0, 2, 1, 'grupos') → 5 puntos (solo ganador)
 * calculatePoints(1, 0, 0, 0, 'grupos') → 2 puntos (solo goles visitante)
 * calculatePoints(1, 0, 2, 2, 'grupos') → 0 puntos (todo mal)
 */
