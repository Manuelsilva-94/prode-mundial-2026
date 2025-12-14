import { useQuery } from '@tanstack/react-query'

interface Match {
  id: string
  homeTeam: {
    id: string
    name: string
    code: string
    flagUrl: string
  }
  awayTeam: {
    id: string
    name: string
    code: string
    flagUrl: string
  }
  matchDate: string
  stadium?: string
  city?: string
  country?: string
  phase: {
    id: string
    name: string
    slug: string
    pointsMultiplier: number
  }
  groupLetter?: string
  homeScore: number | null
  awayScore: number | null
  status: 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'POSTPONED'
  lockTime: string | null
  isLocked: boolean
  userPrediction: {
    id: string
    predictedHomeScore: number
    predictedAwayScore: number
    pointsEarned: number
    createdAt: string
    updatedAt: string
  } | null
}

interface MatchesResponse {
  matches: Match[]
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
  count?: number
}

interface UseMatchesOptions {
  phase?: string // phaseId
  phaseSlug?: string
  status?: 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'POSTPONED'
  dateFrom?: string
  dateTo?: string
  team?: string
  page?: number
  limit?: number
}

async function fetchMatches(
  options: UseMatchesOptions = {}
): Promise<MatchesResponse> {
  const params = new URLSearchParams()

  if (options.phase) params.set('phase', options.phase)
  if (options.phaseSlug) params.set('phaseSlug', options.phaseSlug)
  if (options.status) params.set('status', options.status)
  if (options.dateFrom) params.set('dateFrom', options.dateFrom)
  if (options.dateTo) params.set('dateTo', options.dateTo)
  if (options.team) params.set('team', options.team)
  if (options.page) params.set('page', options.page.toString())
  if (options.limit) params.set('limit', options.limit.toString())

  const res = await fetch(`/api/matches?${params.toString()}`)
  if (!res.ok) {
    throw new Error('Failed to fetch matches')
  }
  return res.json()
}

async function fetchTodayMatches(): Promise<MatchesResponse> {
  const res = await fetch('/api/matches/today')
  if (!res.ok) {
    throw new Error('Failed to fetch today matches')
  }
  return res.json()
}

export function useMatches(options: UseMatchesOptions = {}) {
  return useQuery({
    queryKey: ['matches', options],
    queryFn: () => fetchMatches(options),
  })
}

export function useTodayMatches() {
  return useQuery({
    queryKey: ['matches', 'today'],
    queryFn: fetchTodayMatches,
  })
}
