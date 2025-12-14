import { useMutation, useQueryClient } from '@tanstack/react-query'

interface LeaveTeamResponse {
  message: string
  ownershipTransferred?: boolean
  teamDeleted?: boolean
}

async function leaveTeam(teamId: string): Promise<LeaveTeamResponse> {
  const res = await fetch(`/api/teams/${teamId}/leave`, {
    method: 'POST',
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || error.details?.[0] || 'Failed to leave team')
  }

  return res.json()
}

export function useLeaveTeam() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: leaveTeam,
    onSuccess: () => {
      // Invalidar query después de salir del equipo
      queryClient.invalidateQueries({ queryKey: ['myTeam'] })
    },
  })
}

