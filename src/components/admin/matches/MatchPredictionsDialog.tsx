'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { EmptyState } from '@/components/ui/empty-state'
import { AlertCircle, Trophy, Inbox } from 'lucide-react'
import type { AdminMatch } from '@/hooks/use-admin-matches'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Prediction {
  id: string
  user: {
    id: string
    name: string
    email: string
  }
  predictedHomeScore: number
  predictedAwayScore: number
  pointsEarned: number | null
  pointsBreakdown: any
  createdAt: string
  updatedAt: string
}

interface MatchPredictionsResponse {
  data: {
    match: {
      id: string
      homeTeam: { name: string; code: string; flagUrl: string }
      awayTeam: { name: string; code: string; flagUrl: string }
      homeScore: number | null
      awayScore: number | null
      status: string
      matchDate: string
    }
    predictions: Prediction[]
    total: number
  }
}

interface MatchPredictionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  match: AdminMatch | null
}

export function MatchPredictionsDialog({
  open,
  onOpenChange,
  match,
}: MatchPredictionsDialogProps) {
  const [data, setData] = useState<MatchPredictionsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && match) {
      fetchPredictions()
    } else {
      setData(null)
      setError(null)
    }
  }, [open, match])

  const fetchPredictions = async () => {
    if (!match) return

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/admin/matches/${match.id}/predictions`)
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Error al cargar predicciones')
      }

      const responseData: MatchPredictionsResponse = await res.json()
      setData(responseData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsLoading(false)
    }
  }

  if (!match) return null

  const hasResult =
    match.homeScore !== null && match.awayScore !== null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-4xl max-h-[80vh] overflow-y-auto"
        aria-describedby="predictions-dialog-description"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" aria-hidden="true" />
            Predicciones del Partido
          </DialogTitle>
          <DialogDescription id="predictions-dialog-description">
            {match.homeTeam.name} vs {match.awayTeam.name}
            {hasResult && (
              <span className="ml-2 font-semibold">
                ({match.homeScore} - {match.awayScore})
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : data && data.data.predictions.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="Sin predicciones"
            description="Aún no hay predicciones para este partido. Los usuarios pueden hacer sus predicciones hasta que se bloquee el partido."
            size="md"
          />
        ) : data ? (
          <div className="space-y-4">
            {/* Resumen */}
            <div className="rounded-lg bg-muted p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Total de predicciones</p>
                  <p className="text-2xl font-bold">{data.data.total}</p>
                </div>
                {hasResult && (
                  <div>
                    <p className="text-sm font-medium">Con puntos</p>
                    <p className="text-2xl font-bold">
                      {
                        data.data.predictions.filter(
                          (p) => p.pointsEarned !== null && p.pointsEarned > 0
                        ).length
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Tabla de predicciones */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead className="text-center">Predicción</TableHead>
                    {hasResult && (
                      <>
                        <TableHead className="text-center">Resultado</TableHead>
                        <TableHead className="text-center">Puntos</TableHead>
                      </>
                    )}
                    <TableHead className="text-right">Fecha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.predictions.map((prediction, index) => {
                    const isExact =
                      hasResult &&
                      prediction.predictedHomeScore === data.data.match.homeScore &&
                      prediction.predictedAwayScore === data.data.match.awayScore

                    return (
                      <TableRow key={prediction.id}>
                        <TableCell className="font-medium">
                          {index + 1}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {prediction.user.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {prediction.user.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-bold text-lg">
                            {prediction.predictedHomeScore} -{' '}
                            {prediction.predictedAwayScore}
                          </span>
                        </TableCell>
                        {hasResult && (
                          <>
                            <TableCell className="text-center">
                              <span className="font-bold text-lg">
                                {data.data.match.homeScore} -{' '}
                                {data.data.match.awayScore}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              {prediction.pointsEarned !== null ? (
                                <div className="flex items-center justify-center gap-2">
                                  <Badge
                                    variant={
                                      isExact
                                        ? 'default'
                                        : prediction.pointsEarned > 0
                                          ? 'secondary'
                                          : 'outline'
                                    }
                                    className="font-mono text-sm"
                                  >
                                    {prediction.pointsEarned} pts
                                  </Badge>
                                  {isExact && (
                                    <Trophy className="h-4 w-4 text-yellow-500" />
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                          </>
                        )}
                        <TableCell className="text-right text-sm text-muted-foreground">
                          {format(
                            new Date(prediction.createdAt),
                            'dd/MM/yyyy HH:mm',
                            { locale: es }
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
