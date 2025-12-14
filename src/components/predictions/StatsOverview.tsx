'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Trophy,
  Target,
  CheckCircle2,
  Percent,
  Medal,
  TrendingUp,
  TrendingDown,
  Flame,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatsOverviewProps {
  totalPoints: number
  ranking: number | null
  totalPredictions: number
  correctPredictions: number
  exactScores: number
  accuracyRate: string
  currentStreak: {
    type: 'correct' | 'incorrect' | null
    count: number
  }
  comparison: {
    globalAvgPoints: string
    globalAvgAccuracy: string
    totalUsers: number
    pointsDifference: string
    accuracyDifference: string
  }
}

export function StatsOverview({
  totalPoints,
  ranking,
  totalPredictions,
  correctPredictions,
  exactScores,
  accuracyRate,
  currentStreak,
  comparison,
}: StatsOverviewProps) {
  const pointsDiff = parseFloat(comparison.pointsDifference)
  const accuracyDiff = parseFloat(comparison.accuracyDifference)

  return (
    <div className="space-y-6">
      {/* Main Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Puntos Totales */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Puntos Totales</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPoints.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {pointsDiff !== 0 && (
                <>
                  {pointsDiff > 0 ? (
                    <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
                  )}
                  <span className={cn(pointsDiff > 0 ? 'text-green-500' : 'text-red-500')}>
                    {pointsDiff > 0 ? '+' : ''}{pointsDiff}%
                  </span>
                  <span className="ml-1">vs promedio</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Ranking */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ranking</CardTitle>
            <Medal className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {ranking ? `#${ranking}` : '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              de {comparison.totalUsers} participantes
            </p>
          </CardContent>
        </Card>

        {/* Tasa de Acierto */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Acierto</CardTitle>
            <Percent className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accuracyRate}%</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {accuracyDiff !== 0 && (
                <>
                  {accuracyDiff > 0 ? (
                    <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                  ) : (
                    <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
                  )}
                  <span className={cn(accuracyDiff > 0 ? 'text-green-500' : 'text-red-500')}>
                    {accuracyDiff > 0 ? '+' : ''}{accuracyDiff}%
                  </span>
                  <span className="ml-1">vs promedio</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Racha Actual */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Racha Actual</CardTitle>
            <Flame className={cn(
              'h-4 w-4',
              currentStreak.type === 'correct' ? 'text-orange-500' : 'text-gray-400'
            )} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentStreak.count > 0 ? currentStreak.count : '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              {currentStreak.type === 'correct'
                ? 'predicciones correctas'
                : currentStreak.type === 'incorrect'
                ? 'predicciones incorrectas'
                : 'sin racha activa'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Predicciones Totales */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Predicciones</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPredictions}</div>
            <p className="text-xs text-muted-foreground">
              {correctPredictions} correctas
            </p>
          </CardContent>
        </Card>

        {/* Resultados Exactos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resultados Exactos</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{exactScores}</div>
            <p className="text-xs text-muted-foreground">
              {totalPredictions > 0
                ? `${((exactScores / totalPredictions) * 100).toFixed(1)}% del total`
                : '0% del total'}
            </p>
          </CardContent>
        </Card>

        {/* Promedio por Predicción */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promedio por Predicción</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalPredictions > 0
                ? (totalPoints / totalPredictions).toFixed(1)
                : '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              puntos por predicción
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

