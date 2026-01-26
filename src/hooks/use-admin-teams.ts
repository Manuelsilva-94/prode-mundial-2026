import { useQuery } from '@tanstack/react-query'

export interface AdminTeam {
  id: string
  name: string
  code: string
  flagUrl: string
  groupLetter: string | null
}

async function fetchAdminTeams(): Promise<{ data: AdminTeam[] }> {
  const res = await fetch('/api/admin/teams')
  
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Error al obtener equipos')
  }
  
  return res.json()
}

export function useAdminTeams() {
  return useQuery({
    queryKey: ['adminTeams'],
    queryFn: fetchAdminTeams,
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}

