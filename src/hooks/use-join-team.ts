import { useMutation } from '@tanstack/react-query'

interface JoinTeamData {
  teamId: string
}

interface JoinTeamResponse {
  message: string
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
  }
  membership: {
    role: 'ADMIN' | 'MEMBER'
    joinedAt: string
  }
  members: Array<{
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
  }>
}

async function joinTeam(data: JoinTeamData): Promise<JoinTeamResponse> {
  const res = await fetch('/api/teams/join', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || error.details?.[0] || 'Failed to join team')
  }

  return res.json()
}

export function useJoinTeam() {
  return useMutation({
    mutationFn: joinTeam,
    // No invalidamos automáticamente, lo haremos cuando el usuario cierre el modal de éxito
  })
}

