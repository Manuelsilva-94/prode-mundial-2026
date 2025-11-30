// app/api/admin/matches/[id]/calculate-points/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/session'
import { handleApiError } from '@/lib/api/error-handler'
import { calculatePointsForMatch } from '@/lib/scoring/match-processor'

/**
 * POST /api/admin/matches/:id/calculate-points
 * Calcula y actualiza los puntos para todas las predicciones de un partido
 * Solo accesible por administradores
 *
 * Se debe ejecutar cuando:
 * - Un partido finaliza
 * - Se actualiza el resultado de un partido
 * - Se necesita recalcular puntos manualmente
 */
export async function POST(
  _req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    // Validar que sea admin
    await requireAdmin()

    // Await params (Next.js 15)
    const params = await props.params
    const matchId = params.id

    console.log(`🎯 Admin solicitó cálculo de puntos para partido: ${matchId}`)

    // Ejecutar cálculo de puntos
    const result = await calculatePointsForMatch(matchId)

    return NextResponse.json({
      message: 'Puntos calculados exitosamente',
      data: result,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
