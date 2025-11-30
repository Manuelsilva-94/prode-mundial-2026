// app/api/admin/matches/[id]/result/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/session'
import { handleApiError } from '@/lib/api/error-handler'
import { prisma } from '@/lib/db'
import {
  updateMatchResultSchema,
  validateMatchResultUpdate,
} from '@/lib/validations/match'
import { calculatePointsForMatch } from '@/lib/scoring/match-processor'
import { Prisma } from '@prisma/client'

/**
 * POST /api/admin/matches/:id/result
 * Carga el resultado de un partido y calcula puntos automáticamente
 * Solo accesible por administradores
 *
 * Flujo completo:
 * 1. Validar que sea admin
 * 2. Validar datos del resultado
 * 3. Actualizar partido con scores
 * 4. Cambiar status a FINISHED
 * 5. Calcular puntos automáticamente
 * 6. Actualizar leaderboards
 * 7. Retornar éxito
 */
export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  let matchUpdated = false
  let originalStatus: string | null = null

  try {
    // 1. VALIDACIÓN: Usuario es admin
    const session = await requireAdmin()
    const adminId = session.user.id

    // Await params (Next.js 15)
    const params = await props.params
    const matchId = params.id

    console.log(
      `🎯 Admin ${adminId} cargando resultado para partido ${matchId}`
    )

    const body = await req.json()

    // 2. VALIDACIÓN: Schema de datos
    const validatedData = updateMatchResultSchema.parse(body)
    const { homeScore, awayScore } = validatedData

    // 3. VALIDACIÓN: Partido existe y se puede cargar resultado
    const validation = await validateMatchResultUpdate(matchId)

    if (!validation.isValid || !validation.match) {
      return NextResponse.json(
        {
          error: 'No se puede cargar el resultado',
          details: validation.errors,
        },
        { status: 400 }
      )
    }

    // Guardar status original para posible rollback
    originalStatus = validation.match.status

    console.log(`📊 Cargando resultado: ${homeScore}-${awayScore}`)

    // 4. ACTUALIZAR PARTIDO CON SCORES Y STATUS FINISHED
    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        homeScore,
        awayScore,
        status: 'FINISHED',
        isLocked: true, // Bloquear el partido
        updatedAt: new Date(),
      },
      include: {
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
        _count: {
          select: {
            predictions: true,
          },
        },
      },
    })

    matchUpdated = true

    console.log(
      `✅ Partido actualizado: ${updatedMatch.homeTeam.name} ${homeScore}-${awayScore} ${updatedMatch.awayTeam.name}`
    )

    // 5. CALCULAR PUNTOS AUTOMÁTICAMENTE
    console.log('🎯 Iniciando cálculo automático de puntos...')

    let pointsResult
    try {
      pointsResult = await calculatePointsForMatch(matchId)
      console.log(
        `✅ Puntos calculados: ${pointsResult.predictionsProcessed} predicciones procesadas`
      )
    } catch (pointsError) {
      console.error('❌ Error al calcular puntos:', pointsError)

      // IMPORTANTE: No revertir el partido, pero notificar el error
      // El admin puede recalcular manualmente
      return NextResponse.json(
        {
          success: true,
          warning: 'Resultado cargado pero hubo un error al calcular puntos',
          message:
            'El partido fue actualizado correctamente, pero el cálculo de puntos falló. Por favor, recalcula manualmente.',
          data: {
            match: updatedMatch,
            pointsCalculationError:
              pointsError instanceof Error
                ? pointsError.message
                : 'Error desconocido',
          },
        },
        { status: 207 } // 207 Multi-Status
      )
    }

    // 6. AUDIT LOG
    try {
      await prisma.auditLog.create({
        data: {
          userId: adminId,
          action: 'UPDATE_MATCH_RESULT',
          entityType: 'Match',
          entityId: matchId,
          oldValues: {
            homeScore: validation.match.homeScore,
            awayScore: validation.match.awayScore,
            status: originalStatus,
          } as Prisma.InputJsonValue,
          newValues: {
            homeScore,
            awayScore,
            status: 'FINISHED',
          } as Prisma.InputJsonValue,
        },
      })
    } catch (auditError) {
      console.debug('AuditLog no disponible:', auditError)
    }

    // 7. RETORNAR ÉXITO COMPLETO
    return NextResponse.json(
      {
        success: true,
        message: 'Resultado cargado y puntos calculados exitosamente',
        data: {
          match: updatedMatch,
          pointsCalculation: pointsResult,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('❌ Error en carga de resultado:', error)

    // Si el partido fue actualizado pero hubo error después
    // NO revertimos porque el resultado es válido
    // El admin puede recalcular puntos manualmente
    if (matchUpdated) {
      console.warn(
        '⚠️ Partido actualizado pero proceso no completó. Recalcula puntos manualmente.'
      )
    }

    return handleApiError(error)
  }
}
