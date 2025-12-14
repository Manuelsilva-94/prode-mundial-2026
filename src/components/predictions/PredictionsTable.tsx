'use client'

import * as React from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ChevronDown, ChevronUp, Trophy, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface Prediction {
  id: string
  predictedHomeScore: number
  predictedAwayScore: number
  pointsEarned: number
  pointsBreakdown: {
    total: number
    basePoints: number
    multiplier: number
    breakdown: {
      exactScore?: number
      correctWinnerOrDraw?: number
      correctWinnerPlusOneTeamScore?: number
      correctOneTeamScore?: number
    }
  } | null
  match: {
    id: string
    matchDate: string
    status: string
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
      slug: string
    }
  }
}

interface PredictionsTableProps {
  predictions: Prediction[]
  phases: Array<{ slug: string; name: string }>
}

type FilterResult = 'all' | 'correct' | 'incorrect' | 'exact' | 'pending'
type SortBy = 'date' | 'points'
type SortOrder = 'asc' | 'desc'

export function PredictionsTable({ predictions, phases }: PredictionsTableProps) {
  const [filterPhase, setFilterPhase] = React.useState<string>('all')
  const [filterResult, setFilterResult] = React.useState<FilterResult>('all')
  const [sortBy, setSortBy] = React.useState<SortBy>('date')
  const [sortOrder, setSortOrder] = React.useState<SortOrder>('desc')
  const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set())

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedRows(newExpanded)
  }

  // Filtrar predicciones
  const filteredPredictions = React.useMemo(() => {
    let result = [...predictions]

    // Filtrar por fase
    if (filterPhase !== 'all') {
      result = result.filter((p) => p.match.phase.slug === filterPhase)
    }

    // Filtrar por resultado
    if (filterResult !== 'all') {
      result = result.filter((p) => {
        const isFinished = p.match.status === 'FINISHED'
        const isExact =
          isFinished &&
          p.predictedHomeScore === p.match.homeScore &&
          p.predictedAwayScore === p.match.awayScore
        const isCorrect = p.pointsEarned > 0

        switch (filterResult) {
          case 'exact':
            return isExact
          case 'correct':
            return isFinished && isCorrect && !isExact
          case 'incorrect':
            return isFinished && !isCorrect
          case 'pending':
            return !isFinished
          default:
            return true
        }
      })
    }

    // Ordenar
    result.sort((a, b) => {
      let comparison = 0
      if (sortBy === 'date') {
        comparison = new Date(a.match.matchDate).getTime() - new Date(b.match.matchDate).getTime()
      } else if (sortBy === 'points') {
        comparison = a.pointsEarned - b.pointsEarned
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })

    return result
  }, [predictions, filterPhase, filterResult, sortBy, sortOrder])

  const getResultBadge = (prediction: Prediction) => {
    const isFinished = prediction.match.status === 'FINISHED'
    
    if (!isFinished) {
      return (
        <Badge variant="secondary" className="flex items-center space-x-1">
          <Clock className="h-3 w-3" />
          <span>Pendiente</span>
        </Badge>
      )
    }

    const isExact =
      prediction.predictedHomeScore === prediction.match.homeScore &&
      prediction.predictedAwayScore === prediction.match.awayScore

    if (isExact) {
      return (
        <Badge className="flex items-center space-x-1 bg-yellow-500 hover:bg-yellow-600">
          <Trophy className="h-3 w-3" />
          <span>Exacto</span>
        </Badge>
      )
    }

    if (prediction.pointsEarned > 0) {
      return (
        <Badge variant="default" className="flex items-center space-x-1 bg-green-500 hover:bg-green-600">
          <CheckCircle2 className="h-3 w-3" />
          <span>Correcto</span>
        </Badge>
      )
    }

    return (
      <Badge variant="destructive" className="flex items-center space-x-1">
        <XCircle className="h-3 w-3" />
        <span>Incorrecto</span>
      </Badge>
    )
  }

  const getBreakdownLabel = (key: string): string => {
    switch (key) {
      case 'exactScore':
        return 'Resultado exacto'
      case 'correctWinnerOrDraw':
        return 'Ganador/Empate correcto'
      case 'correctWinnerPlusOneTeamScore':
        return 'Ganador + goles de 1 equipo'
      case 'correctOneTeamScore':
        return 'Goles de 1 equipo correcto'
      default:
        return key
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial de Predicciones</CardTitle>
        <CardDescription>
          Todas tus predicciones con detalles de puntuación
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtros */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <Select value={filterPhase} onValueChange={setFilterPhase}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Fase" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las fases</SelectItem>
                {phases.map((phase) => (
                  <SelectItem key={phase.slug} value={phase.slug}>
                    {phase.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterResult} onValueChange={(v) => setFilterResult(v as FilterResult)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Resultado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="exact">Exactos</SelectItem>
                <SelectItem value="correct">Correctos</SelectItem>
                <SelectItem value="incorrect">Incorrectos</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Fecha</SelectItem>
                <SelectItem value="points">Puntos</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Tabla */}
        {filteredPredictions.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-muted-foreground">
            No hay predicciones que coincidan con los filtros
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Partido</TableHead>
                  <TableHead className="text-center">Tu Predicción</TableHead>
                  <TableHead className="text-center">Resultado</TableHead>
                  <TableHead className="text-center">Puntos</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPredictions.map((prediction) => {
                  const isExpanded = expandedRows.has(prediction.id)
                  const hasBreakdown = prediction.pointsBreakdown && prediction.pointsEarned > 0

                  return (
                    <React.Fragment key={prediction.id}>
                      <TableRow
                        className={cn(
                          'cursor-pointer transition-colors',
                          hasBreakdown && 'hover:bg-muted/50'
                        )}
                        onClick={() => hasBreakdown && toggleRow(prediction.id)}
                      >
                        <TableCell>
                          {hasBreakdown && (
                            <ChevronDown
                              className={cn(
                                'h-4 w-4 transition-transform',
                                isExpanded && 'rotate-180'
                              )}
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2 text-sm font-medium">
                              <span>{prediction.match.homeTeam.code}</span>
                              <span className="text-muted-foreground">vs</span>
                              <span>{prediction.match.awayTeam.code}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(prediction.match.matchDate), "d MMM yyyy, HH:mm", { locale: es })}
                              {' · '}
                              {prediction.match.phase.name}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-mono font-medium">
                            {prediction.predictedHomeScore} - {prediction.predictedAwayScore}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {prediction.match.status === 'FINISHED' ? (
                            <span className="font-mono font-medium">
                              {prediction.match.homeScore} - {prediction.match.awayScore}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={cn(
                            'font-bold',
                            prediction.pointsEarned > 0 ? 'text-green-600' : 'text-muted-foreground'
                          )}>
                            {prediction.match.status === 'FINISHED' ? (
                              prediction.pointsEarned > 0 ? `+${prediction.pointsEarned}` : '0'
                            ) : (
                              '-'
                            )}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {getResultBadge(prediction)}
                        </TableCell>
                      </TableRow>

                      {/* Breakdown expandido */}
                      {isExpanded && hasBreakdown && prediction.pointsBreakdown && (
                        <TableRow className="bg-muted/30">
                          <TableCell colSpan={6}>
                            <div className="py-2 pl-10">
                              <p className="mb-2 text-sm font-medium">Desglose de puntos:</p>
                              <div className="space-y-1">
                                {Object.entries(prediction.pointsBreakdown.breakdown).map(([key, value]) => (
                                  value ? (
                                    <div key={key} className="flex items-center justify-between text-sm">
                                      <span className="text-muted-foreground">{getBreakdownLabel(key)}</span>
                                      <span className="font-medium text-green-600">+{value}</span>
                                    </div>
                                  ) : null
                                ))}
                                {prediction.pointsBreakdown.multiplier !== 1 && (
                                  <div className="flex items-center justify-between border-t pt-1 text-sm">
                                    <span className="text-muted-foreground">Multiplicador de fase</span>
                                    <span className="font-medium">x{prediction.pointsBreakdown.multiplier}</span>
                                  </div>
                                )}
                                <div className="flex items-center justify-between border-t pt-1 text-sm font-medium">
                                  <span>Total</span>
                                  <span className="text-green-600">+{prediction.pointsBreakdown.total}</span>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Resumen */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Mostrando {filteredPredictions.length} de {predictions.length} predicciones
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

