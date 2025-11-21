import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { handleApiError } from '@/lib/api/error-handler'

export async function GET(
  _request: NextRequest, // ← Agregar underscore
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Verificar autenticación
    await requireAuth()

    const params = await context.params
    const userId = params.id.trim().toLowerCase()

    // Validar UUID
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(userId)) {
      return NextResponse.json(
        { error: 'ID de usuario inválido' },
        { status: 400 }
      )
    }

    const userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true },
    })

    if (!userExists) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    const predictions = await prisma.prediction.findMany({
      where: {
        userId,
        match: {
          OR: [{ status: 'FINISHED' }, { isLocked: true }],
        },
      },
      include: {
        match: {
          include: {
            homeTeam: {
              select: { name: true, code: true, flagUrl: true },
            },
            awayTeam: {
              select: { name: true, code: true, flagUrl: true },
            },
            phase: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: {
        match: { matchDate: 'desc' },
      },
    })

    return NextResponse.json({
      userName: userExists.name,
      predictions: predictions.map((pred) => ({
        id: pred.id,
        predictedHomeScore: pred.predictedHomeScore,
        predictedAwayScore: pred.predictedAwayScore,
        pointsEarned: pred.pointsEarned,
        match: {
          id: pred.match.id,
          homeTeam: pred.match.homeTeam,
          awayTeam: pred.match.awayTeam,
          homeScore: pred.match.homeScore,
          awayScore: pred.match.awayScore,
          status: pred.match.status,
          matchDate: pred.match.matchDate,
          phase: pred.match.phase.name,
        },
      })),
    })
  } catch (error) {
    return handleApiError(error)
  }
}
