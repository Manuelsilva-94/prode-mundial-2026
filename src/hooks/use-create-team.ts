import { useMutation } from '@tanstack/react-query'

interface CreateTeamData {
  name: string
  description?: string | null
}

interface CreateTeamResponse {
  message: string
  data: {
    id: string
    name: string
    description: string | null
    inviteCode: string
    creatorId: string
    createdAt: string
    updatedAt: string
    creator: {
      id: string
      name: string
      email: string
      avatarUrl: string | null
    }
  }
}

async function createTeam(data: CreateTeamData): Promise<CreateTeamResponse> {
  const res = await fetch('/api/teams', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || error.details?.[0] || 'Failed to create team')
  }

  return res.json()
}

export function useCreateTeam() {
  return useMutation({
    mutationFn: createTeam,
    // No invalidamos automáticamente, lo haremos cuando el usuario cierre el modal de éxito
  })
}

