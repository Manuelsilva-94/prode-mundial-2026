import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { handleApiError } from '@/lib/api/error-handler'
import { updateMatchSchema } from '@/lib/validations/match'
import { subHours } from 'date-fns'
import { calculatePointsForMatch } from '@/lib/scoring/match-processor'

/**
 * GET /api/admin/matches/[id]
 * Obtener un partido específico (solo admin)
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await context.params

    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        homeTeam: {
          select: { id: true, name: true, code: true, flagUrl: true },
        },
        awayTeam: {
          select: { id: true, name: true, code: true, flagUrl: true },
        },
        phase: {
          select: { id: true, name: true, slug: true, pointsMultiplier: true },
        },
        _count: {
          select: { predictions: true },
        },
      },
    })

    if (!match) {
      return NextResponse.json(
        { error: 'Partido no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: match })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PATCH /api/admin/matches/[id]
 * Actualizar un partido (solo admin)
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await context.params

    const body = await request.json()
    const data = updateMatchSchema.parse(body)

    // Verificar que el partido existe
    const existingMatch = await prisma.match.findUnique({
      where: { id },
      include: {
        _count: { select: { predictions: true } },
      },
    })

    if (!existingMatch) {
      return NextResponse.json(
        { error: 'Partido no encontrado' },
        { status: 404 }
      )
    }

    // Preparar datos de actualización
    const updateData: Record<string, unknown> = {}

    if (data.homeTeamId) updateData.homeTeamId = data.homeTeamId
    if (data.awayTeamId) updateData.awayTeamId = data.awayTeamId
    if (data.stadium) updateData.stadium = data.stadium
    if (data.city) updateData.city = data.city
    if (data.country) updateData.country = data.country
    if (data.phaseId) updateData.phaseId = data.phaseId
    if (data.groupLetter !== undefined) updateData.groupLetter = data.groupLetter
    if (data.status) updateData.status = data.status

    // Si se actualiza la fecha, recalcular lockTime
    if (data.matchDate) {
      const matchDate = new Date(data.matchDate)
      updateData.matchDate = matchDate
      updateData.lockTime = subHours(matchDate, 1)
    }

    // Manejar scores
    if (data.homeScore !== undefined) updateData.homeScore = data.homeScore
    if (data.awayScore !== undefined) updateData.awayScore = data.awayScore

    // Si se está finalizando el partido con scores, calcular puntos
    const isFinishing = data.status === 'FINISHED' && 
      data.homeScore !== undefined && 
      data.awayScore !== undefined

    const match = await prisma.match.update({
      where: { id },
      data: updateData,
      include: {
        homeTeam: {
          select: { id: true, name: true, code: true, flagUrl: true },
        },
        awayTeam: {
          select: { id: true, name: true, code: true, flagUrl: true },
        },
        phase: {
          select: { id: true, name: true, slug: true },
        },
        _count: {
          select: { predictions: true },
        },
      },
    })

    // Calcular puntos si el partido se finalizó
    if (isFinishing) {
      try {
        await calculatePointsForMatch(id)
      } catch (error) {
        console.error('Error calculating points:', error)
        // No fallar la actualización si el cálculo de puntos falla
      }
    }

    return NextResponse.json({
      data: match,
      message: isFinishing
        ? 'Partido actualizado y puntos calculados'
        : 'Partido actualizado',
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/admin/matches/[id]
 * Eliminar un partido (solo admin)
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await context.params

    const forceDelete = request.nextUrl.searchParams.get('force') === 'true'

    // Verificar que el partido existe y contar predicciones
    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        _count: { select: { predictions: true } },
      },
    })

    if (!match) {
      return NextResponse.json(
        { error: 'Partido no encontrado' },
        { status: 404 }
      )
    }

    // Si hay predicciones y no es force delete, advertir
    if (match._count.predictions > 0 && !forceDelete) {
      return NextResponse.json(
        {
          error: 'Este partido tiene predicciones asociadas',
          predictionsCount: match._count.predictions,
          requiresForce: true,
        },
        { status: 409 }
      )
    }

    // Eliminar predicciones primero si es force delete
    if (forceDelete && match._count.predictions > 0) {
      await prisma.prediction.deleteMany({
        where: { matchId: id },
      })
    }

    // Eliminar el partido
    await prisma.match.delete({
      where: { id },
    })

    return NextResponse.json({
      message: 'Partido eliminado correctamente',
      deletedPredictions: forceDelete ? match._count.predictions : 0,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
