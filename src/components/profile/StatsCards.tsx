'use client'

import { TrendingUp, Trophy, Target, BarChart3 } from 'lucide-react'
import { StatCard } from '@/components/ui/stat-card'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useUserStats } from '@/hooks/use-user-stats'

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-24" />
      </CardContent>
    </Card>
  )
}

export function StatsCards() {
  const { data: stats, isLoading } = useUserStats()

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total de Puntos"
        value={stats?.totalPoints ?? 0}
        icon={Trophy}
      />
      <StatCard
        title="Ranking"
        value={stats?.ranking ? `#${stats.ranking}` : '-'}
        description={
          stats?.ranking
            ? `de ${stats.comparison.totalUsers} usuarios`
            : undefined
        }
        icon={TrendingUp}
      />
      <StatCard
        title="Predicciones"
        value={stats?.totalPredictions ?? 0}
        description={`${stats?.correctPredictions ?? 0} correctas`}
        icon={Target}
      />
      <StatCard
        title="Tasa de Acierto"
        value={stats?.accuracyRate ? `${stats.accuracyRate}%` : '0%'}
        description={`${stats?.exactScores ?? 0} resultados exactos`}
        icon={BarChart3}
      />
    </div>
  )
}
