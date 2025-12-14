import { useQuery } from '@tanstack/react-query'

interface TeamPreview {
  id: string
  name: string
  description: string | null
  creator: {
    id: string
    name: string
    avatarUrl: string | null
  }
  memberCount: number
  createdAt: string
}

async function fetchTeamByCode(code: string): Promise<TeamPreview> {
  const res = await fetch(`/api/teams/search?code=${encodeURIComponent(code)}`)
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || error.details?.[0] || 'Team not found')
  }
  return res.json()
}

export function useTeamByCode(code: string | null, enabled = true) {
  return useQuery({
    queryKey: ['teamByCode', code],
    queryFn: () => fetchTeamByCode(code!),
    enabled: enabled && !!code && code.length === 6,
  })
}

