'use client'

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

// Loading fallbacks
const ChartSkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-4 w-64" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-[300px] w-full" />
    </CardContent>
  </Card>
)

const TableLoadingSkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-48" />
    </CardHeader>
    <CardContent className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </CardContent>
  </Card>
)

/**
 * Lazy loaded chart component
 * Solo se carga cuando se necesita (recharts es pesado ~200kb)
 */
export const LazyPointsEvolutionChart = dynamic(
  () => import('@/components/predictions/PointsEvolutionChart').then((mod) => mod.PointsEvolutionChart),
  {
    loading: () => <ChartSkeleton />,
    ssr: false, // Charts no necesitan SSR
  }
)

/**
 * Lazy loaded predictions table
 * Componente grande con muchas dependencias
 */
export const LazyPredictionsTable = dynamic(
  () => import('@/components/predictions/PredictionsTable').then((mod) => mod.PredictionsTable),
  {
    loading: () => <TableLoadingSkeleton />,
  }
)

/**
 * Lazy loaded phase breakdown
 */
export const LazyPhaseBreakdown = dynamic(
  () => import('@/components/predictions/PhaseBreakdown').then((mod) => mod.PhaseBreakdown),
  {
    loading: () => <TableLoadingSkeleton />,
  }
)

/**
 * Lazy loaded team detail dialog
 */
export const LazyTeamDetailDialog = dynamic(
  () => import('@/components/teams/TeamDetailDialog').then((mod) => mod.TeamDetailDialog),
  {
    ssr: false,
  }
)

