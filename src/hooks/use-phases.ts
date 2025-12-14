import { useQuery } from '@tanstack/react-query'

interface Phase {
  id: string
  name: string
  slug: string
  sortOrder: number
}

async function fetchPhases(): Promise<Phase[]> {
  // Obtener fases desde la API de matches (la respuesta incluye fase en cada match)
  // Por ahora usamos un endpoint que devuelve las fases
  // Si no existe, las extraemos de los matches
  const res = await fetch('/api/test')
  if (!res.ok) {
    // Fallback: obtener de matches
    const matchesRes = await fetch('/api/matches?limit=1')
    if (!matchesRes.ok) {
      throw new Error('Failed to fetch phases')
    }
    const matchesData = await matchesRes.json()
    // Extraer fases únicas
    const phaseMap = new Map<string, Phase>()

    interface MatchWithPhase {
      phase?: {
        id: string
        name: string
        slug: string
      }
    }

    const matches = (matchesData.matches || []) as MatchWithPhase[]
    matches.forEach((match) => {
      if (match.phase && !phaseMap.has(match.phase.id)) {
        phaseMap.set(match.phase.id, {
          id: match.phase.id,
          name: match.phase.name,
          slug: match.phase.slug,
          sortOrder: 0, // No disponible en matches
        })
      }
    })
    return Array.from(phaseMap.values())
  }
  const data = await res.json()
  return data.data?.phases || []
}

export function usePhases() {
  return useQuery({
    queryKey: ['phases'],
    queryFn: fetchPhases,
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}
