'use client'

import * as React from 'react'
import { useInView } from 'react-intersection-observer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { usePredictions } from '@/hooks/use-predictions'
import { Skeleton } from '@/components/ui/skeleton'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import Image from 'next/image'
import { Trophy, X, CheckCircle2 } from 'lucide-react'

function PredictionItem({
  prediction,
}: {
  prediction: {
    id: string
    predictedHomeScore: number
    predictedAwayScore: number
    pointsEarned: number
    isExact: boolean
    createdAt: string
    match: {
      id: string
      matchDate: string
      status: 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'POSTPONED'
      homeScore: number | null
      awayScore: number | null
      homeTeam: {
        name: string
        code: string
        flagUrl: string
      }
      awayTeam: {
        name: string
        code: string
        flagUrl: string
      }
      phase: {
        name: string
      }
    }
  }
}) {
  const match = prediction.match
  const isFinished = match.status === 'FINISHED'
  const hasScore = match.homeScore !== null && match.awayScore !== null

  return (
    <div className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
      <div className="flex-1">
        {/* Fecha y Fase */}
        <div className="mb-2 flex items-center justify-between">
          <span className="text-muted-foreground text-sm">
            {format(
              new Date(match.matchDate),
              "dd 'de' MMMM, yyyy 'a las' HH:mm",
              {
                locale: es,
              }
            )}
          </span>
          <Badge variant="outline">{match.phase.name}</Badge>
        </div>

        {/* Equipos */}
        <div className="mb-2 flex items-center space-x-4">
          <div className="flex flex-1 items-center space-x-2">
            <div className="relative h-6 w-8">
              <Image
                src={match.homeTeam.flagUrl}
                alt={match.homeTeam.name}
                fill
                className="object-contain"
              />
            </div>
            <span className="font-medium">{match.homeTeam.name}</span>
            <span className="text-muted-foreground">vs</span>
            <span className="font-medium">{match.awayTeam.name}</span>
            <div className="relative h-6 w-8">
              <Image
                src={match.awayTeam.flagUrl}
                alt={match.awayTeam.name}
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>

        {/* Predicción y Resultado */}
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <span className="text-muted-foreground">Tu predicción:</span>
            <span className="font-medium">
              {prediction.predictedHomeScore} - {prediction.predictedAwayScore}
            </span>
          </div>
          {isFinished && hasScore && (
            <>
              <span className="text-muted-foreground">•</span>
              <div className="flex items-center space-x-2">
                <span className="text-muted-foreground">Resultado:</span>
                <span className="font-medium">
                  {match.homeScore} - {match.awayScore}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Puntos */}
      <div className="ml-4 flex flex-col items-end space-y-2">
        {isFinished && (
          <div className="flex items-center space-x-1">
            {prediction.pointsEarned > 0 ? (
              prediction.isExact ? (
                <Trophy className="h-5 w-5 text-yellow-500" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              )
            ) : (
              <X className="h-5 w-5 text-red-500" />
            )}
            <span
              className={`text-lg font-bold ${
                prediction.pointsEarned > 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {prediction.pointsEarned > 0 ? '+' : ''}
              {prediction.pointsEarned}
            </span>
          </div>
        )}
        {prediction.isExact && isFinished && (
          <Badge variant="default" className="bg-yellow-500">
            Exacto
          </Badge>
        )}
      </div>
    </div>
  )
}

export function PredictionsHistory() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = usePredictions({
    orderBy: 'date',
    order: 'desc',
    limit: 20,
  })

  const { ref, inView } = useInView({
    threshold: 0,
  })

  React.useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  const predictions = data?.pages.flatMap((page) => page.data) ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial de Predicciones</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-16 w-full" />
              </div>
            ))}
          </div>
        )}

        {isError && (
          <div className="text-muted-foreground py-8 text-center">
            Error al cargar las predicciones
          </div>
        )}

        {!isLoading && !isError && predictions.length === 0 && (
          <div className="text-muted-foreground py-8 text-center">
            No hay predicciones aún
          </div>
        )}

        {!isLoading && !isError && predictions.length > 0 && (
          <div className="space-y-4">
            {predictions.map((prediction) => (
              <PredictionItem key={prediction.id} prediction={prediction} />
            ))}
            {isFetchingNextPage && (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full" />
              </div>
            )}
            {hasNextPage && <div ref={ref} className="h-4" />}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
