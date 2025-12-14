import { useQuery } from '@tanstack/react-query'

export interface TeamLeaderboardEntry {
  id: string
  name: string
  description: string | null
  inviteCode: string
  createdAt: string
  creator: {
    id: string
    name: string
    avatarUrl: string | null
  }
  memberCount: number
  totalPoints: number
  averagePoints: number
  totalPredictions: number
  correctPredictions: number
  exactScores: number
  ranking: number
}

interface TeamsLeaderboardResponse {
  teams: TeamLeaderboardEntry[]
  currentUserTeam: {
    id: string
    ranking: number
  } | null
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

interface UseTeamsLeaderboardOptions {
  page?: number
  limit?: number
  search?: string
}

async function fetchTeamsLeaderboard(
  options: UseTeamsLeaderboardOptions
): Promise<TeamsLeaderboardResponse> {
  const params = new URLSearchParams()

  if (options.page) params.set('page', options.page.toString())
  if (options.limit) params.set('limit', options.limit.toString())
  if (options.search) params.set('search', options.search)

  const res = await fetch(`/api/teams/leaderboard?${params.toString()}`)

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Failed to fetch teams leaderboard')
  }

  return res.json()
}

export function useTeamsLeaderboard(options: UseTeamsLeaderboardOptions = {}) {
  return useQuery({
    queryKey: ['teamsLeaderboard', options],
    queryFn: () => fetchTeamsLeaderboard(options),
  })
}

