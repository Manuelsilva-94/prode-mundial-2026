// lib/validations/prediction.ts
import { z } from 'zod'
import { prisma } from '@/lib/db'
// FIX: "utcToZonedTime" was renamed to "toZonedTime" in date-fns-tz v3
// FIX: Removed unused "zonedTimeToUtc"
import { toZonedTime } from 'date-fns-tz'
import { isBefore } from 'date-fns'

// ==========================================
// SCHEMAS DE VALIDACIÓN
// ==========================================

export const createPredictionSchema = z.object({
  matchId: z.string().uuid('ID de partido inválido'),
  predictedHomeScore: z
    .number()
    .int('El marcador debe ser un número entero')
    .min(0, 'El marcador no puede ser negativo'),
  predictedAwayScore: z
    .number()
    .int('El marcador debe ser un número entero')
    .min(0, 'El marcador no puede ser negativo'),
})

export const updatePredictionSchema = z.object({
  predictedHomeScore: z
    .number()
    .int('El marcador debe ser un número entero')
    .min(0, 'El marcador no puede ser negativo'),
  predictedAwayScore: z
    .number()
    .int('El marcador debe ser un número entero')
    .min(0, 'El marcador no puede ser negativo'),
})

export type CreatePredictionInput = z.infer<typeof createPredictionSchema>
export type UpdatePredictionInput = z.infer<typeof updatePredictionSchema>

// ==========================================
// FUNCIONES DE LOCKTIME
// ==========================================

/**
 * Verifica si un partido está bloqueado (lockTime ya pasó)
 * CRÍTICO: Todo en UTC para evitar problemas de timezone
 */
export function isMatchLocked(lockTime: Date): boolean {
  const now = new Date() // Siempre en UTC en el servidor
  return isBefore(lockTime, now) // Si lockTime es antes que now, está bloqueado
}

/**
 * Obtiene información detallada del lockTime para logging
 */
export function getLockTimeInfo(lockTime: Date, userTimezone = 'UTC') {
  const now = new Date()

  // FIX: Updated function name for date-fns-tz v3
  const lockTimeInUserTZ = toZonedTime(lockTime, userTimezone)
  const nowInUserTZ = toZonedTime(now, userTimezone)

  return {
    lockTimeUTC: lockTime.toISOString(),
    lockTimeUserTZ: lockTimeInUserTZ.toISOString(),
    nowUTC: now.toISOString(),
    nowUserTZ: nowInUserTZ.toISOString(),
    isLocked: isMatchLocked(lockTime),
    minutesUntilLock: Math.round((lockTime.getTime() - now.getTime()) / 60000),
  }
}

// ==========================================
// VALIDACIONES DE NEGOCIO
// ==========================================

export interface PredictionValidationResult {
  isValid: boolean
  errors: string[]
  match?: {
    id: string
    status: string
    lockTime: Date
    matchDate: Date
    isLocked: boolean
  }
}

/**
 * Valida que se pueda crear/actualizar una predicción
 * CRÍTICA: Validaciones estrictas de lockTime
 */
export async function validatePrediction(
  matchId: string,
  userId: string
): Promise<PredictionValidationResult> {
  const errors: string[] = []

  // 1. Verificar que el partido existe
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: {
      id: true,
      status: true,
      lockTime: true,
      matchDate: true,
      isLocked: true,
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
    errors.push('El partido no existe')
    return {
      isValid: false,
      errors,
    }
  }

  // 2. Verificar que el partido esté en status SCHEDULED
  if (match.status !== 'SCHEDULED') {
    errors.push(
      `No se puede predecir un partido con status "${match.status}". Solo se permiten predicciones para partidos programados.`
    )
  }

  // 3. CRÍTICO: Verificar lockTime (en UTC)
  const isLocked = isMatchLocked(match.lockTime)

  if (isLocked) {
    const lockInfo = getLockTimeInfo(match.lockTime)
    errors.push(
      `El partido está bloqueado. El tiempo límite para predecir era: ${match.lockTime.toISOString()}`
    )

    // Log para debugging de timezone issues
    console.warn('🔒 Intento de predicción bloqueada:', {
      userId,
      matchId,
      match: `${match.homeTeam.name} vs ${match.awayTeam.name}`,
      lockInfo,
    })
  }

  // 4. Verificar que el partido no haya sido marcado como locked en DB
  if (match.isLocked) {
    errors.push('El partido ha sido bloqueado manualmente por un administrador')
  }

  return {
    isValid: errors.length === 0,
    errors,
    match: {
      id: match.id,
      status: match.status,
      lockTime: match.lockTime,
      matchDate: match.matchDate,
      isLocked: match.isLocked,
    },
  }
}

/**
 * Valida que un usuario pueda actualizar su predicción
 */
export async function validatePredictionUpdate(
  matchId: string,
  userId: string
): Promise<PredictionValidationResult> {
  // Usar la misma validación que para crear
  const validation = await validatePrediction(matchId, userId)

  if (!validation.isValid) {
    return validation
  }

  // Verificar que la predicción exista
  const existingPrediction = await prisma.prediction.findUnique({
    where: {
      userId_matchId: {
        userId,
        matchId,
      },
    },
  })

  if (!existingPrediction) {
    validation.errors.push('No existe una predicción para actualizar')
    validation.isValid = false
  }

  return validation
}

/**
 * Log de actividad de predicciones para auditoría
 */
export async function logPredictionActivity(data: {
  userId: string
  matchId: string
  action: 'CREATE' | 'UPDATE' | 'BLOCKED'
  success: boolean
  reason?: string
  metadata?: Record<string, unknown>
}) {
  // Podrías implementar logging a una tabla de auditoría
  console.log('📊 Predicción Activity:', {
    timestamp: new Date().toISOString(),
    ...data,
  })
}
