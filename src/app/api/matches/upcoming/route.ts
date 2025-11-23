import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { getUpcomingMatches } from '@/lib/queries/matches'
import { handleApiError } from '@/lib/api/error-handler'

export async function GET(request: NextRequest) {
  try {
    // Obtener usuario actual (opcional)
    const currentUser = await getCurrentUser()

    // Obtener limit de query params
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '20')

    // Obtener próximos partidos
    const result = await getUpcomingMatches(currentUser?.id, limit)

    // Formatear respuesta
    const formattedMatches = result.matches.map((match) => ({
      id: match.id,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      matchDate: match.matchDate,
      stadium: match.stadium,
      city: match.city,
      phase: match.phase,
      groupLetter: match.groupLetter,
      lockTime: match.lockTime,
      isLocked: match.isLocked,
      userPrediction: match.predictions?.[0] || null,
    }))

    return NextResponse.json({
      matches: formattedMatches,
      pagination: result.pagination,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
