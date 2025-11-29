// app/api/predictions/route.ts
import { NextRequest, NextResponse } from 'next/server'
// FIX: Import Prisma types to handle the "where" clause type safely
import { Prisma } from '@prisma/client'
import { requireAuth } from '@/lib/auth/session'
import { handleApiError } from '@/lib/api/error-handler'
import { prisma } from '@/lib/db'
import {
  createPredictionSchema,
  validatePrediction,
  logPredictionActivity,
} from '@/lib/validations/prediction'

/**
 * POST /api/predictions
 * Crea o actualiza una predicción (UPSERT)
 * Validación CRÍTICA de lockTime
 */
export async function POST(req: NextRequest) {
  try {
    // 1. VALIDACIÓN: Usuario autenticado
    const session = await requireAuth()
    const userId = session.user.id

    const body = await req.json()

    // 2. VALIDACIÓN: Schema de datos
    const validatedData = createPredictionSchema.parse(body)

    const { matchId, predictedHomeScore, predictedAwayScore } = validatedData

    // 3. VALIDACIÓN CRÍTICA: Partido existe, está SCHEDULED, y NO está bloqueado
    const validation = await validatePrediction(matchId, userId)

    if (!validation.isValid) {
      // Log intento bloqueado
      await logPredictionActivity({
        userId,
        matchId,
        action: 'BLOCKED',
        success: false,
        reason: validation.errors.join(', '),
        metadata: {
          predictedHomeScore,
          predictedAwayScore,
          lockTime: validation.match?.lockTime,
        },
      })

      return NextResponse.json(
        {
          error: 'No se puede crear la predicción',
          details: validation.errors,
        },
        { status: 400 }
      )
    }

    // 4. UPSERT: Crear o actualizar predicción
    const prediction = await prisma.prediction.upsert({
      where: {
        userId_matchId: {
          userId,
          matchId,
        },
      },
      update: {
        predictedHomeScore,
        predictedAwayScore,
        updatedAt: new Date(),
      },
      create: {
        userId,
        matchId,
        predictedHomeScore,
        predictedAwayScore,
      },
      include: {
        match: {
          select: {
            id: true,
            matchDate: true,
            lockTime: true,
            status: true,
            homeTeam: {
              select: {
                id: true,
                name: true,
                code: true,
                flagUrl: true,
              },
            },
            awayTeam: {
              select: {
                id: true,
                name: true,
                code: true,
                flagUrl: true,
              },
            },
            phase: {
              select: {
                id: true,
                name: true,
                slug: true,
                pointsMultiplier: true,
              },
            },
          },
        },
      },
    })

    // 5. Log actividad exitosa
    await logPredictionActivity({
      userId,
      matchId,
      action:
        prediction.createdAt.getTime() === prediction.updatedAt.getTime()
          ? 'CREATE'
          : 'UPDATE',
      success: true,
      metadata: {
        predictedHomeScore,
        predictedAwayScore,
      },
    })

    return NextResponse.json(
      {
        message: 'Predicción guardada exitosamente',
        data: prediction,
      },
      { status: 200 }
    )
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * GET /api/predictions
 * Obtiene todas las predicciones del usuario autenticado
 * Query params: ?matchId=... (opcional para filtrar por partido)
 */
export async function GET(req: NextRequest) {
  try {
    // Usuario autenticado
    const session = await requireAuth()
    const userId = session.user.id

    const searchParams = req.nextUrl.searchParams
    const matchId = searchParams.get('matchId')

    // FIX: Replaced "any" with the specific Prisma input type
    const where: Prisma.PredictionWhereInput = {
      userId,
    }

    if (matchId) {
      where.matchId = matchId
    }

    // Obtener predicciones
    const predictions = await prisma.prediction.findMany({
      where,
      include: {
        match: {
          select: {
            id: true,
            matchDate: true,
            lockTime: true,
            status: true,
            homeScore: true,
            awayScore: true,
            homeTeam: {
              select: {
                id: true,
                name: true,
                code: true,
                flagUrl: true,
              },
            },
            awayTeam: {
              select: {
                id: true,
                name: true,
                code: true,
                flagUrl: true,
              },
            },
            phase: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({
      data: predictions,
      count: predictions.length,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
