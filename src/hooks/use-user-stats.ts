import { useQuery } from '@tanstack/react-query'

interface UserStats {
  totalPoints: number
  ranking: number | null
  totalPredictions: number
  correctPredictions: number
  exactScores: number
  accuracyRate: string
  bestPrediction: {
    matchId: string
    matchDate: string
    pointsEarned: number
    predictedScore: string
    actualScore: string | null
  } | null
  currentStreak: {
    type: 'correct' | 'incorrect' | null
    count: number
  }
  pointsEvolution: Array<{
    date: string
    points: number
    cumulative: number
  }>
  statsByPhase: Array<{
    phaseId: string
    phaseName: string
    phaseSlug: string
    totalPredictions: number
    correctPredictions: number
    exactScores: number
    totalPoints: number
    accuracyRate: string
    avgPoints: string
  }>
  comparison: {
    globalAvgPoints: string
    globalAvgAccuracy: string
    totalUsers: number
    pointsDifference: string
    accuracyDifference: string
  }
}

async function fetchUserStats(): Promise<UserStats> {
  const res = await fetch('/api/users/me/stats')
  if (!res.ok) {
    throw new Error('Failed to fetch user stats')
  }
  return res.json()
}

export function useUserStats() {
  return useQuery({
    queryKey: ['userStats'],
    queryFn: fetchUserStats,
  })
}
