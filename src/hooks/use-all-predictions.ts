import { useQuery } from '@tanstack/react-query'

interface Prediction {
  id: string
  predictedHomeScore: number
  predictedAwayScore: number
  pointsEarned: number
  pointsBreakdown: {
    total: number
    basePoints: number
    multiplier: number
    breakdown: {
      exactScore?: number
      correctWinnerOrDraw?: number
      correctWinnerPlusOneTeamScore?: number
      correctOneTeamScore?: number
    }
  } | null
  isExact: boolean
  createdAt: string
  updatedAt: string
  match: {
    id: string
    matchDate: string
    status: string
    homeScore: number | null
    awayScore: number | null
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

interface AllPredictionsResponse {
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

async function fetchAllPredictions(): Promise<Prediction[]> {
  // Obtener todas las predicciones (límite alto)
  const res = await fetch('/api/predictions/me?limit=100&orderBy=date&order=desc')
  if (!res.ok) {
    throw new Error('Failed to fetch predictions')
  }
  const data: AllPredictionsResponse = await res.json()
  return data.data
}

export function useAllPredictions() {
  return useQuery({
    queryKey: ['allPredictions'],
    queryFn: fetchAllPredictions,
  })
}

