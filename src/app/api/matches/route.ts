import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/session'
import { matchFiltersSchema } from '@/lib/validations/match'
import { getMatches } from '@/lib/queries/matches'
import { handleApiError } from '@/lib/api/error-handler'

export async function GET(request: NextRequest) {
  try {
    // Obtener usuario actual (opcional - endpoint público)
    const currentUser = await getCurrentUser()

    // Parsear query params
    const searchParams = request.nextUrl.searchParams
    const filters = matchFiltersSchema.parse({
      phase: searchParams.get('phase') || undefined,
      team: searchParams.get('team') || undefined,
      status: searchParams.get('status') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 20,
    })

    // Convertir fechas si existen
    const dateFrom = filters.dateFrom ? new Date(filters.dateFrom) : undefined
    const dateTo = filters.dateTo ? new Date(filters.dateTo) : undefined

    // Obtener partidos
    const result = await getMatches({
      userId: currentUser?.id,
      phase: filters.phase,
      team: filters.team,
      status: filters.status,
      dateFrom,
      dateTo,
      page: filters.page,
      limit: filters.limit,
    })

    // Formatear respuesta
    const formattedMatches = result.matches.map((match) => ({
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
      // Incluir predicción si existe
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
