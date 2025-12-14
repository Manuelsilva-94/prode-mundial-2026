'use client'

import { useUserStats } from '@/hooks/use-user-stats'
import { useAllPredictions } from '@/hooks/use-all-predictions'
import { StatsOverview } from '@/components/predictions/StatsOverview'
import {
  LazyPointsEvolutionChart,
  LazyPredictionsTable,
  LazyPhaseBreakdown,
} from '@/components/lazy'
import { PageHeader } from '@/components/ui/page-header'
import { TableSkeleton } from '@/components/ui/skeletons'
import { ErrorMessage } from '@/components/ui/error-message'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function MyPredictionsPage() {
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useUserStats()

  const {
    data: predictions,
    isLoading: predictionsLoading,
    error: predictionsError,
    refetch: refetchPredictions,
  } = useAllPredictions()

  const isLoading = statsLoading || predictionsLoading
  const error = statsError || predictionsError

  if (isLoading) {
    return (
      <div className="container mx-auto space-y-8 px-4 py-8">
        <PageHeader
          title="Mis Predicciones"
          description="Estadísticas detalladas y historial completo"
        />

        {/* Stats Skeleton */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
                <Skeleton className="mt-2 h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Chart Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>

        {/* Table Skeleton */}
        <TableSkeleton rows={5} columns={6} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto space-y-8 px-4 py-8">
        <PageHeader
          title="Mis Predicciones"
          description="Estadísticas detalladas y historial completo"
        />
        <ErrorMessage
          message="Error al cargar tus estadísticas. Por favor, intenta de nuevo."
          onRetry={() => {
            refetchStats()
            refetchPredictions()
          }}
        />
      </div>
    )
  }

  if (!stats) {
    return null
  }

  // Extraer fases únicas de las predicciones
  const phases = predictions
    ? Array.from(
        new Map(
          predictions.map((p) => [
            p.match.phase.slug,
            { slug: p.match.phase.slug, name: p.match.phase.name },
          ])
        ).values()
      )
    : []

  return (
    <div className="container mx-auto space-y-8 px-4 py-8">
      <PageHeader
        title="Mis Predicciones"
        description="Estadísticas detalladas y historial completo"
      />

      {/* Stats Overview */}
      <StatsOverview
        totalPoints={stats.totalPoints}
        ranking={stats.ranking}
        totalPredictions={stats.totalPredictions}
        correctPredictions={stats.correctPredictions}
        exactScores={stats.exactScores}
        accuracyRate={stats.accuracyRate}
        currentStreak={stats.currentStreak}
        comparison={stats.comparison}
      />

      {/* Points Evolution Chart - Lazy loaded (recharts es pesado) */}
      <LazyPointsEvolutionChart data={stats.pointsEvolution} />

      {/* Phase Breakdown - Lazy loaded */}
      <LazyPhaseBreakdown statsByPhase={stats.statsByPhase} />

      {/* Predictions Table - Lazy loaded */}
      {predictions && predictions.length > 0 && (
        <LazyPredictionsTable predictions={predictions} phases={phases} />
      )}
    </div>
  )
}
