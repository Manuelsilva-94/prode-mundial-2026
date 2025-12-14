import { useMutation, useQueryClient } from '@tanstack/react-query'

interface CreatePredictionData {
  matchId: string
  predictedHomeScore: number
  predictedAwayScore: number
}

interface PredictionResponse {
  message: string
  data: {
    id: string
    matchId: string
    predictedHomeScore: number
    predictedAwayScore: number
    pointsEarned: number
    createdAt: string
    updatedAt: string
    match: {
      id: string
      matchDate: string
      lockTime: string | null
      status: string
      homeTeam: {
        id: string
        name: string
        code: string
        flagUrl: string
      }
      awayTeam: {
        id: string
        name: string
        code: string
        flagUrl: string
      }
      phase: {
        id: string
        name: string
        slug: string
        pointsMultiplier: number
      }
    }
  }
}

async function createPrediction(
  data: CreatePredictionData
): Promise<PredictionResponse> {
  const res = await fetch('/api/predictions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(
      error.error || error.details?.[0] || 'Failed to create prediction'
    )
  }

  return res.json()
}

export function useCreatePrediction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createPrediction,
    onMutate: async (newPrediction) => {
      // Cancelar queries en curso para evitar sobrescribir optimistic update
      await queryClient.cancelQueries({ queryKey: ['matches'] })
      await queryClient.cancelQueries({ queryKey: ['predictions'] })

      // Snapshot del valor anterior
      const previousMatches = queryClient.getQueriesData({
        queryKey: ['matches'],
      })

      // Optimistic update: actualizar matches con la nueva predicción
      interface MatchWithPrediction {
        id: string
        userPrediction?: {
          id: string
          predictedHomeScore: number
          predictedAwayScore: number
          pointsEarned: number
          createdAt: string
          updatedAt: string
        } | null
      }

      interface MatchesQueryData {
        matches?: MatchWithPrediction[]
      }

      queryClient.setQueriesData(
        { queryKey: ['matches'] },
        (old: MatchesQueryData | undefined) => {
          if (!old?.matches) return old

          return {
            ...old,
            matches: old.matches.map((match) => {
              if (match.id === newPrediction.matchId) {
                return {
                  ...match,
                  userPrediction: {
                    id: 'temp',
                    predictedHomeScore: newPrediction.predictedHomeScore,
                    predictedAwayScore: newPrediction.predictedAwayScore,
                    pointsEarned: 0,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  },
                }
              }
              return match
            }),
          }
        }
      )

      return { previousMatches }
    },
    onError: (_err, _newPrediction, context) => {
      // Revertir en caso de error
      if (context?.previousMatches) {
        context.previousMatches.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
    },
    onSuccess: () => {
      // Invalidar queries para refrescar datos
      queryClient.invalidateQueries({ queryKey: ['matches'] })
      queryClient.invalidateQueries({ queryKey: ['predictions'] })
      queryClient.invalidateQueries({ queryKey: ['userStats'] })
    },
  })
}
