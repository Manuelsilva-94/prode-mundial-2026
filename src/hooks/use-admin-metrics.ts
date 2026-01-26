import { useQuery } from '@tanstack/react-query'

interface AdminMetrics {
  overview: {
    totalUsers: number
    totalPredictions: number
    totalTeams: number
    totalMatches: number
  }
  matches: {
    pending: number
    live: number
    finished: number
    scheduled: number
  }
  activity: {
    usersToday: number
    usersLastWeek: number
    predictionsToday: number
    predictionsLastWeek: number
    userGrowthRate: string
    predictionRate: string
  }
  recent: {
    users: Array<{
      id: string
      name: string
      email: string
      createdAt: string
    }>
    predictions: Array<{
      id: string
      userName: string
      match: string
      prediction: string
      createdAt: string
    }>
  }
}

async function fetchAdminMetrics(): Promise<AdminMetrics> {
  const res = await fetch('/api/admin/metrics')
  if (!res.ok) {
    if (res.status === 403) {
      throw new Error('No tienes permisos de administrador')
    }
    throw new Error('Error al cargar las métricas')
  }
  return res.json()
}

export function useAdminMetrics() {
  return useQuery({
    queryKey: ['adminMetrics'],
    queryFn: fetchAdminMetrics,
    refetchInterval: 30000, // Refrescar cada 30 segundos
    staleTime: 10000, // Considerar stale después de 10 segundos
  })
}

