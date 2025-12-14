import { useQuery } from '@tanstack/react-query'

interface TeamMember {
  id: string
  userId: string
  role: 'ADMIN' | 'MEMBER'
  joinedAt: string
  user: {
    id: string
    name: string
    email: string
    avatarUrl: string | null
  }
  stats: {
    totalPoints: number
    totalPredictions: number
    correctPredictions: number
    exactScores: number
    accuracyRate: number | string
  }
}

interface MyTeamResponse {
  team: {
    id: string
    name: string
    description: string | null
    inviteCode: string
    creator: {
      id: string
      name: string
      email: string
      avatarUrl: string | null
    }
    createdAt: string
    updatedAt: string
    ranking: number
    totalTeams: number
    averagePoints: number
  } | null
  membership: {
    id: string
    role: 'ADMIN' | 'MEMBER'
    joinedAt: string
    isCreator: boolean
  } | null
  members: TeamMember[]
}

async function fetchMyTeam(): Promise<MyTeamResponse> {
  const res = await fetch('/api/teams/me')
  if (!res.ok) {
    throw new Error('Failed to fetch team')
  }
  return res.json()
}

export function useMyTeam() {
  return useQuery({
    queryKey: ['myTeam'],
    queryFn: fetchMyTeam,
  })
}

