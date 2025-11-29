// app/api/predictions/[matchId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { handleApiError } from '@/lib/api/error-handler'
import { prisma } from '@/lib/db'
import {
  updatePredictionSchema,
  validatePredictionUpdate,
  logPredictionActivity,
} from '@/lib/validations/prediction'

/**
 * GET /api/predictions/:matchId
 * Obtiene la predicción del usuario para un partido específico
 */
export async function GET(
  _req: NextRequest,
  props: { params: Promise<{ matchId: string }> }
) {
  try {
    // Usuario autenticado
    const session = await requireAuth()
    const userId = session.user.id

    // Await params (Next.js 15)
    const params = await props.params

    // Buscar predicción
    const prediction = await prisma.prediction.findUnique({
      where: {
        userId_matchId: {
          userId,
          matchId: params.matchId,
        },
      },
      include: {
        match: {
          select: {
            id: true,
            matchDate: true,
            lockTime: true,
            status: true,
            homeScore: true,
            awayScore: true,
            isLocked: true,
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

    if (!prediction) {
      return NextResponse.json(
        { error: 'No existe predicción para este partido' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: prediction })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PATCH /api/predictions/:matchId
 * Actualiza una predicción existente
 * Validación CRÍTICA de lockTime
 */
export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ matchId: string }> }
) {
  try {
    // 1. VALIDACIÓN: Usuario autenticado
    const session = await requireAuth()
    const userId = session.user.id

    // Await params (Next.js 15)
    const params = await props.params
    const matchId = params.matchId

    const body = await req.json()

    // 2. VALIDACIÓN: Schema de datos
    const validatedData = updatePredictionSchema.parse(body)

    const { predictedHomeScore, predictedAwayScore } = validatedData

    // 3. VALIDACIÓN CRÍTICA: Predicción existe y partido NO está bloqueado
    const validation = await validatePredictionUpdate(matchId, userId)

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
          error: 'No se puede actualizar la predicción',
          details: validation.errors,
        },
        { status: 400 }
      )
    }

    // 4. Actualizar predicción
    const prediction = await prisma.prediction.update({
      where: {
        userId_matchId: {
          userId,
          matchId,
        },
      },
      data: {
        predictedHomeScore,
        predictedAwayScore,
        updatedAt: new Date(),
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
      action: 'UPDATE',
      success: true,
      metadata: {
        predictedHomeScore,
        predictedAwayScore,
      },
    })

    return NextResponse.json({
      message: 'Predicción actualizada exitosamente',
      data: prediction,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/predictions/:matchId
 * Elimina una predicción
 * Solo permitido antes del lockTime
 */
export async function DELETE(
  _req: NextRequest,
  props: { params: Promise<{ matchId: string }> }
) {
  try {
    // 1. Usuario autenticado
    const session = await requireAuth()
    const userId = session.user.id

    // Await params (Next.js 15)
    const params = await props.params
    const matchId = params.matchId

    // 2. Validar que se pueda eliminar (mismo que actualizar)
    const validation = await validatePredictionUpdate(matchId, userId)

    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: 'No se puede eliminar la predicción',
          details: validation.errors,
        },
        { status: 400 }
      )
    }

    // 3. Eliminar predicción
    await prisma.prediction.delete({
      where: {
        userId_matchId: {
          userId,
          matchId,
        },
      },
    })

    return NextResponse.json({
      message: 'Predicción eliminada exitosamente',
    })
  } catch (error) {
    return handleApiError(error)
  }
}
