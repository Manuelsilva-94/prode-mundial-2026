// lib/scoring/match-processor.ts
import { prisma } from '@/lib/db'
import { calculatePoints, validateScores } from './calculator'
import { PointsBreakdown } from './rules'
import { Prisma } from '@prisma/client'

/**
 * PROCESA PUNTOS PARA TODAS LAS PREDICCIONES DE UN PARTIDO
 *
 * Esta función debe ejecutarse cuando:
 * 1. Un partido finaliza (status cambia a FINISHED)
 * 2. Se corrige el resultado de un partido
 * 3. Un admin actualiza manualmente los scores
 *
 * @param matchId - ID del partido a procesar
 * @returns Resultado del procesamiento con estadísticas
 */
export async function calculatePointsForMatch(matchId: string) {
  console.log(`🎯 Iniciando cálculo de puntos para partido: ${matchId}`)

  // ============================================
  // 1. OBTENER INFORMACIÓN DEL PARTIDO
  // ============================================
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      phase: {
        select: {
          slug: true,
          pointsMultiplier: true,
        },
      },
      homeTeam: {
        select: {
          name: true,
          code: true,
        },
      },
      awayTeam: {
        select: {
          name: true,
          code: true,
        },
      },
    },
  })

  if (!match) {
    throw new Error(`Partido ${matchId} no encontrado`)
  }

  // ============================================
  // 2. VALIDAR QUE EL PARTIDO TENGA RESULTADO
  // ============================================
  if (!validateScores(match.homeScore, match.awayScore)) {
    throw new Error(
      `Partido ${matchId} no tiene resultado válido. homeScore: ${match.homeScore}, awayScore: ${match.awayScore}`
    )
  }

  // ============================================
  // 3. OBTENER TODAS LAS PREDICCIONES DEL PARTIDO
  // ============================================
  const predictions = await prisma.prediction.findMany({
    where: {
      matchId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  })

  console.log(`📊 Encontradas ${predictions.length} predicciones para procesar`)

  if (predictions.length === 0) {
    console.log('⚠️  No hay predicciones para este partido')
    return {
      matchId,
      predictionsProcessed: 0,
      totalPointsAwarded: 0,
      match: {
        homeTeam: match.homeTeam.name,
        awayTeam: match.awayTeam.name,
        score: `${match.homeScore}-${match.awayScore}`,
      },
    }
  }

  // ============================================
  // 4. CALCULAR PUNTOS PARA CADA PREDICCIÓN
  // ============================================
  const results: Array<{
    userId: string
    userName: string
    points: number
    breakdown: PointsBreakdown['breakdown']
  }> = []

  let totalPointsAwarded = 0
  let updateErrors = 0

  for (const prediction of predictions) {
    try {
      // Calcular puntos
      const pointsResult = calculatePoints(
        prediction.predictedHomeScore,
        prediction.predictedAwayScore,
        match.homeScore!,
        match.awayScore!,
        match.phase.slug
      )

      // Guardar en base de datos - Prisma.InputJsonValue para escritura
      // Guardar en base de datos
      await prisma.prediction.update({
        where: {
          id: prediction.id,
        },
        data: {
          pointsEarned: pointsResult.total,
          pointsBreakdown: pointsResult as unknown as Prisma.InputJsonValue,
          updatedAt: new Date(),
        },
      })
      totalPointsAwarded += pointsResult.total

      results.push({
        userId: prediction.user.id,
        userName: prediction.user.name,
        points: pointsResult.total,
        breakdown: pointsResult.breakdown,
      })

      console.log(
        `✅ ${prediction.user.name}: ${pointsResult.total} puntos (predicción: ${prediction.predictedHomeScore}-${prediction.predictedAwayScore})`
      )
    } catch (error) {
      console.error(`❌ Error procesando predicción ${prediction.id}:`, error)
      updateErrors++
    }
  }

  // ============================================
  // 5. ACTUALIZAR LEADERBOARDS
  // ============================================
  console.log('📊 Actualizando leaderboards...')
  await updateLeaderboards()

  // ============================================
  // 6. LOG DE AUDITORÍA
  // ============================================
  try {
    await prisma.auditLog.create({
      data: {
        userId: null,
        action: 'CALCULATE_MATCH_POINTS',
        entityType: 'Match',
        entityId: matchId,
        newValues: {
          predictionsProcessed: predictions.length,
          totalPointsAwarded,
          errors: updateErrors,
        } as Prisma.InputJsonValue,
      },
    })
  } catch (error) {
    console.debug('AuditLog no disponible', error)
  }

  // ============================================
  // 7. RETORNAR RESUMEN
  // ============================================
  const summary = {
    matchId,
    match: {
      homeTeam: match.homeTeam.name,
      awayTeam: match.awayTeam.name,
      score: `${match.homeScore}-${match.awayScore}`,
      phase: match.phase.slug,
      multiplier: match.phase.pointsMultiplier,
    },
    predictionsProcessed: predictions.length,
    totalPointsAwarded,
    errors: updateErrors,
    topScorers: results
      .sort((a, b) => b.points - a.points)
      .slice(0, 5)
      .map((r) => ({
        name: r.userName,
        points: r.points,
      })),
  }

  console.log('🎉 Cálculo de puntos completado:', summary)

  return summary
}

/**
 * ACTUALIZA LOS LEADERBOARDS (CACHE)
 *
 * Recalcula las posiciones de todos los usuarios basado en sus puntos totales
 */
export async function updateLeaderboards() {
  try {
    // Obtener todos los usuarios con sus predicciones
    const users = await prisma.user.findMany({
      include: {
        predictions: {
          select: {
            pointsEarned: true,
            predictedHomeScore: true,
            predictedAwayScore: true,
            match: {
              select: {
                homeScore: true,
                awayScore: true,
              },
            },
          },
        },
      },
    })

    // Calcular estadísticas por usuario
    const userStats = users.map((user) => {
      const totalPoints = user.predictions.reduce(
        (sum, pred) => sum + (pred.pointsEarned || 0),
        0
      )

      const totalPredictions = user.predictions.length

      const correctPredictions = user.predictions.filter((pred) => {
        if (!pred.match.homeScore || !pred.match.awayScore) return false
        return (
          pred.predictedHomeScore === pred.match.homeScore &&
          pred.predictedAwayScore === pred.match.awayScore
        )
      }).length

      const exactScores = correctPredictions

      const accuracyRate =
        totalPredictions > 0 ? (correctPredictions / totalPredictions) * 100 : 0

      return {
        userId: user.id,
        totalPoints,
        totalPredictions,
        correctPredictions,
        exactScores,
        accuracyRate: Math.round(accuracyRate * 100) / 100,
      }
    })

    // Ordenar por puntos (descendente)
    const sortedUsers = userStats.sort((a, b) => b.totalPoints - a.totalPoints)

    // Asignar rankings
    const rankedUsers = sortedUsers.map((userStat, index) => ({
      ...userStat,
      ranking: index + 1,
      previousRanking: userStat.totalPredictions > 0 ? index + 1 : null,
      rankingChange: 0,
    }))

    // Actualizar leaderboard cache para cada usuario
    for (const userStat of rankedUsers) {
      await prisma.leaderboardCache.upsert({
        where: {
          userId: userStat.userId,
        },
        update: {
          totalPoints: userStat.totalPoints,
          totalPredictions: userStat.totalPredictions,
          correctPredictions: userStat.correctPredictions,
          exactScores: userStat.exactScores,
          ranking: userStat.ranking,
          previousRanking: userStat.previousRanking,
          rankingChange: userStat.rankingChange,
          accuracyRate: userStat.accuracyRate,
          updatedAt: new Date(),
        },
        create: {
          userId: userStat.userId,
          totalPoints: userStat.totalPoints,
          totalPredictions: userStat.totalPredictions,
          correctPredictions: userStat.correctPredictions,
          exactScores: userStat.exactScores,
          ranking: userStat.ranking,
          previousRanking: userStat.previousRanking,
          rankingChange: userStat.rankingChange,
          accuracyRate: userStat.accuracyRate,
        },
      })
    }

    console.log(
      `✅ Leaderboard actualizado para ${rankedUsers.length} usuarios`
    )
  } catch (error) {
    console.error('❌ Error actualizando leaderboards:', error)
    throw error
  }
}

/**
 * FUNCIÓN HELPER: Recalcular puntos de TODOS los partidos finalizados
 * Útil para:
 * - Correcciones masivas
 * - Cambios en reglas de puntuación
 * - Migraciones
 */
export async function recalculateAllPoints() {
  console.log('🔄 Recalculando puntos de todos los partidos finalizados...')

  const finishedMatches = await prisma.match.findMany({
    where: {
      status: 'FINISHED',
      homeScore: { not: null },
      awayScore: { not: null },
    },
    select: {
      id: true,
    },
  })

  console.log(`📊 Encontrados ${finishedMatches.length} partidos finalizados`)

  let processed = 0
  let errors = 0

  for (const match of finishedMatches) {
    try {
      await calculatePointsForMatch(match.id)
      processed++
    } catch (error) {
      console.error(`❌ Error en partido ${match.id}:`, error)
      errors++
    }
  }

  console.log(
    `✅ Recálculo completado: ${processed} procesados, ${errors} errores`
  )

  return { processed, errors }
}
