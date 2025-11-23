import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { getMatchById } from '@/lib/queries/matches'
import { handleApiError } from '@/lib/api/error-handler'

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const matchId = params.id.trim().toLowerCase()

    // Validar UUID
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(matchId)) {
      return NextResponse.json(
        { error: 'ID de partido inválido' },
        { status: 400 }
      )
    }

    // Obtener usuario actual (opcional)
    const currentUser = await getCurrentUser()

    // Obtener partido
    const match = await getMatchById(matchId, currentUser?.id)

    if (!match) {
      return NextResponse.json(
        { error: 'Partido no encontrado' },
        { status: 404 }
      )
    }

    // Formatear respuesta
    return NextResponse.json({
      match: {
        id: match.id,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        matchDate: match.matchDate,
        stadium: match.stadium,
        city: match.city,
        country: match.country,
        phase: match.phase,
        groupLetter: match.groupLetter,
        homeScore: match.homeScore,
        awayScore: match.awayScore,
        status: match.status,
        lockTime: match.lockTime,
        isLocked: match.isLocked,
        createdAt: match.createdAt,
        updatedAt: match.updatedAt,
        // Predicción del usuario
        userPrediction: match.predictions?.[0] || null,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
