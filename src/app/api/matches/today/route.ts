import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { getTodayMatches } from '@/lib/queries/matches'
import { handleApiError } from '@/lib/api/error-handler'

export async function GET() {
  try {
    // Obtener usuario actual (opcional)
    const currentUser = await getCurrentUser()

    // Obtener partidos de hoy
    const result = await getTodayMatches(currentUser?.id)

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
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      status: match.status,
      lockTime: match.lockTime,
      isLocked: match.isLocked,
      userPrediction: match.predictions?.[0] || null,
    }))

    return NextResponse.json({
      matches: formattedMatches,
      count: formattedMatches.length,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
