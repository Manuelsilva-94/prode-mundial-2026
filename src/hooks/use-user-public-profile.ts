import { useQuery } from '@tanstack/react-query'

interface UserPublicProfile {
  user: {
    id: string
    name: string
    avatarUrl: string | null
    memberSince: string
  }
  stats: {
    totalPoints: number
    totalPredictions: number
    correctPredictions: number
    exactScores: number
    ranking: number
    accuracyRate: number
  }
}

async function fetchUserPublicProfile(userId: string): Promise<UserPublicProfile> {
  const res = await fetch(`/api/users/${userId}`)
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Failed to fetch user profile')
  }
  return res.json()
}

export function useUserPublicProfile(userId: string | null) {
  return useQuery({
    queryKey: ['userPublicProfile', userId],
    queryFn: () => fetchUserPublicProfile(userId!),
    enabled: !!userId,
  })
}

