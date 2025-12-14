import { useQuery } from '@tanstack/react-query'

interface LeaderboardEntry {
  id: string
  userId: string
  totalPoints: number
  totalPredictions: number
  correctPredictions: number
  exactScores: number
  ranking: number
  previousRanking: number | null
  rankingChange: number
  accuracyRate: number | string
  updatedAt: string
  user: {
    id: string
    name: string
    avatarUrl: string | null
  }
}

interface LeaderboardResponse {
  data: LeaderboardEntry[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  personal: LeaderboardEntry | null
}

interface UseLeaderboardOptions {
  page?: number
  limit?: number
  search?: string
}

async function fetchLeaderboard(
  options: UseLeaderboardOptions = {}
): Promise<LeaderboardResponse> {
  const params = new URLSearchParams()

  if (options.page) params.set('page', options.page.toString())
  if (options.limit) params.set('limit', options.limit.toString())
  if (options.search) params.set('search', options.search)

  const res = await fetch(`/api/leaderboard?${params.toString()}`)
  if (!res.ok) {
    throw new Error('Failed to fetch leaderboard')
  }
  return res.json()
}

export function useLeaderboard(options: UseLeaderboardOptions = {}) {
  return useQuery({
    queryKey: ['leaderboard', options],
    queryFn: () => fetchLeaderboard(options),
  })
}

