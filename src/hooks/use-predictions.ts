import { useInfiniteQuery } from '@tanstack/react-query'

interface Prediction {
  id: string
  predictedHomeScore: number
  predictedAwayScore: number
  pointsEarned: number
  isExact: boolean
  createdAt: string
  match: {
    id: string
    matchDate: string
    lockTime: string | null
    status: 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'POSTPONED'
    homeScore: number | null
    awayScore: number | null
    isLocked: boolean
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
    phase: {
      id: string
      name: string
      slug: string
      pointsMultiplier: number
    }
  }
}

interface PredictionsResponse {
  data: Prediction[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

interface UsePredictionsOptions {
  phaseId?: string
  phaseSlug?: string
  result?: 'correct' | 'incorrect' | 'exact'
  orderBy?: 'date' | 'points' | 'created'
  order?: 'asc' | 'desc'
  limit?: number
}

async function fetchPredictions(
  page: number,
  options: UsePredictionsOptions = {}
): Promise<PredictionsResponse> {
  const {
    phaseId,
    phaseSlug,
    result,
    orderBy = 'date',
    order = 'desc',
    limit = 20,
  } = options

  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    orderBy,
    order,
  })

  if (phaseId) params.set('phaseId', phaseId)
  if (phaseSlug) params.set('phaseSlug', phaseSlug)
  if (result) params.set('result', result)

  const res = await fetch(`/api/predictions/me?${params.toString()}`)
  if (!res.ok) {
    throw new Error('Failed to fetch predictions')
  }
  return res.json()
}

export function usePredictions(options: UsePredictionsOptions = {}) {
  return useInfiniteQuery({
    queryKey: ['predictions', 'me', options],
    queryFn: ({ pageParam = 1 }) => fetchPredictions(pageParam, options),
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.hasNextPage) {
        return lastPage.pagination.page + 1
      }
      return undefined
    },
    initialPageParam: 1,
  })
}
