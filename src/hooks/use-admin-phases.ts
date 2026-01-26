import { useQuery } from '@tanstack/react-query'
import { Decimal } from '@prisma/client/runtime/library'

export interface AdminPhase {
  id: string
  name: string
  slug: string
  sortOrder: number
  pointsMultiplier: Decimal | number
}

async function fetchAdminPhases(): Promise<{ data: AdminPhase[] }> {
  const res = await fetch('/api/admin/phases')
  
  if (!res.ok) {
    const error = await res.json()
    throw new Error(error.error || 'Error al obtener fases')
  }
  
  return res.json()
}

export function useAdminPhases() {
  return useQuery({
    queryKey: ['adminPhases'],
    queryFn: fetchAdminPhases,
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}

