// app/api/admin/matches/[id]/predictions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/session'
import { handleApiError } from '@/lib/api/error-handler'
import { prisma } from '@/lib/db'

/**
 * GET /api/admin/matches/:id/predictions
 * Obtiene todas las predicciones de un partido (solo admin)
 */
export async function GET(
  _req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()

    const params = await props.params
    const matchId = params.id

    // Verificar que el partido existe
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: {
        id: true,
        homeTeam: {
          select: { name: true, code: true, flagUrl: true },
        },
        awayTeam: {
          select: { name: true, code: true, flagUrl: true },
        },
        homeScore: true,
        awayScore: true,
        status: true,
        matchDate: true,
      },
    })

    if (!match) {
      return NextResponse.json(
        { error: 'Partido no encontrado' },
        { status: 404 }
      )
    }

    // Obtener todas las predicciones del partido
    const predictions = await prisma.prediction.findMany({
      where: { matchId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        { pointsEarned: 'desc' },
        { createdAt: 'asc' },
      ],
    })

    return NextResponse.json({
      data: {
        match: {
          id: match.id,
          homeTeam: match.homeTeam,
          awayTeam: match.awayTeam,
          homeScore: match.homeScore,
          awayScore: match.awayScore,
          status: match.status,
          matchDate: match.matchDate,
        },
        predictions: predictions.map((pred) => ({
          id: pred.id,
          user: {
            id: pred.user.id,
            name: pred.user.name,
            email: pred.user.email,
          },
          predictedHomeScore: pred.predictedHomeScore,
          predictedAwayScore: pred.predictedAwayScore,
          pointsEarned: pred.pointsEarned,
          pointsBreakdown: pred.pointsBreakdown,
          createdAt: pred.createdAt,
          updatedAt: pred.updatedAt,
        })),
        total: predictions.length,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
