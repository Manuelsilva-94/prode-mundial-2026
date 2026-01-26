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
import { AlertCircle, Trophy, TrendingUp, TrendingDown } from 'lucide-react'

interface LeaderboardEntry {
  ranking: number
  previousRanking: number | null
  rankingChange: number
  totalPoints: number
  accuracyRate: number | null
  user: {
    id: string
    name: string
    avatarUrl: string | null
  }
}

interface LeaderboardPreviewProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LeaderboardPreview({
  open,
  onOpenChange,
}: LeaderboardPreviewProps) {
  const [data, setData] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      fetchLeaderboard()
    }
  }, [open])

  const fetchLeaderboard = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/leaderboard?limit=10')
      if (!res.ok) {
        throw new Error('Error al cargar el leaderboard')
      }

      const responseData = await res.json()
      setData(responseData.data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsLoading(false)
    }
  }

  const getRankingChangeIcon = (change: number) => {
    if (change > 0) {
      return <TrendingUp className="h-3 w-3 text-green-600" />
    } else if (change < 0) {
      return <TrendingDown className="h-3 w-3 text-red-600" />
    }
    return null
  }

  const getRankingChangeText = (change: number) => {
    if (change > 0) {
      return `+${change}`
    } else if (change < 0) {
      return `${change}`
    }
    return '-'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Preview del Leaderboard
          </DialogTitle>
          <DialogDescription>
            Top 10 del ranking actual. Los puntos se actualizarán automáticamente al guardar el resultado.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : data.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No hay datos en el leaderboard.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">#</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead className="text-center">Puntos</TableHead>
                  <TableHead className="text-center">Precisión</TableHead>
                  <TableHead className="text-center">Cambio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((entry) => (
                  <TableRow key={entry.user.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {entry.ranking}
                        {entry.ranking === 1 && (
                          <Trophy className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {entry.user.avatarUrl ? (
                          <img
                            src={entry.user.avatarUrl}
                            alt={entry.user.name}
                            className="h-6 w-6 rounded-full"
                          />
                        ) : (
                          <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs">
                            {entry.user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="font-medium">{entry.user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className="font-mono">
                        {entry.totalPoints}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center text-sm text-muted-foreground">
                      {entry.accuracyRate !== null && typeof entry.accuracyRate === 'number'
                        ? `${entry.accuracyRate.toFixed(1)}%`
                        : '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      {entry.previousRanking !== null && entry.rankingChange !== 0 ? (
                        <div className="flex items-center justify-center gap-1">
                          {getRankingChangeIcon(entry.rankingChange)}
                          <span
                            className={`text-xs ${
                              entry.rankingChange > 0
                                ? 'text-green-600'
                                : entry.rankingChange < 0
                                  ? 'text-red-600'
                                  : ''
                            }`}
                          >
                            {getRankingChangeText(entry.rankingChange)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="rounded-lg bg-muted p-3">
          <p className="text-xs text-muted-foreground">
            💡 Al guardar el resultado, los puntos se calcularán automáticamente y el leaderboard se actualizará.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
