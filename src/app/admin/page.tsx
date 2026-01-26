'use client'

import { useAdminMetrics } from '@/hooks/use-admin-metrics'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { MetricCard } from '@/components/admin/MetricCard'
import { QuickActionCard } from '@/components/admin/QuickActionCard'
import { RecentActivity } from '@/components/admin/RecentActivity'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { ErrorMessage } from '@/components/ui/error-message'
import {
  Users,
  Target,
  Trophy,
  UsersRound,
  Clock,
  PlayCircle,
  CheckCircle2,
  Calendar,
  Calculator,
  FileEdit,
  UserCog,
  RefreshCw,
} from 'lucide-react'

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>

      {/* Metrics skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-9 w-20" />
              <Skeleton className="mt-2 h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick actions skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center p-4">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <div className="ml-4 flex-1">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="mt-1 h-4 w-32" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent activity skeleton */}
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="flex items-center space-x-3">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="mt-1 h-3 w-32" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default function AdminDashboardPage() {
  const { data: metrics, isLoading, error, refetch } = useAdminMetrics()

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />

      <main className="flex-1 overflow-auto">
        <div className="container mx-auto px-4 py-8 lg:px-8">
          {isLoading ? (
            <DashboardSkeleton />
          ) : error ? (
            <ErrorMessage
              message={error.message || 'Error al cargar las métricas'}
              onRetry={() => refetch()}
            />
          ) : metrics ? (
            <div className="space-y-8">
              {/* Header */}
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground mt-1">
                  Panel de administración del Prode Mundial 2026
                </p>
              </div>

              {/* Métricas principales */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                  title="Total Usuarios"
                  value={metrics.overview.totalUsers}
                  description={`+${metrics.activity.usersToday} hoy`}
                  icon={Users}
                  iconColor="text-blue-500"
                  trend={{
                    value: parseFloat(metrics.activity.userGrowthRate),
                    label: 'esta semana',
                  }}
                />
                <MetricCard
                  title="Total Predicciones"
                  value={metrics.overview.totalPredictions}
                  description={`+${metrics.activity.predictionsToday} hoy`}
                  icon={Target}
                  iconColor="text-green-500"
                />
                <MetricCard
                  title="Equipos Creados"
                  value={metrics.overview.totalTeams}
                  description="Equipos activos"
                  icon={UsersRound}
                  iconColor="text-purple-500"
                />
                <MetricCard
                  title="Promedio Predicciones"
                  value={metrics.activity.predictionRate}
                  description="Por usuario"
                  icon={Calculator}
                  iconColor="text-orange-500"
                />
              </div>

              {/* Estado de partidos */}
              <div>
                <h2 className="mb-4 text-xl font-semibold">Estado de Partidos</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <MetricCard
                    title="Pendientes de Resultado"
                    value={metrics.matches.pending}
                    description="Partidos ya jugados"
                    icon={Clock}
                    iconColor="text-yellow-500"
                  />
                  <MetricCard
                    title="En Vivo"
                    value={metrics.matches.live}
                    description="Ahora mismo"
                    icon={PlayCircle}
                    iconColor="text-red-500"
                  />
                  <MetricCard
                    title="Finalizados"
                    value={metrics.matches.finished}
                    description="Con resultado"
                    icon={CheckCircle2}
                    iconColor="text-green-500"
                  />
                  <MetricCard
                    title="Programados"
                    value={metrics.matches.scheduled}
                    description="Por jugar"
                    icon={Calendar}
                    iconColor="text-blue-500"
                  />
                </div>
              </div>

              {/* Acciones rápidas */}
              <div>
                <h2 className="mb-4 text-xl font-semibold">Acciones Rápidas</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <QuickActionCard
                    title="Gestionar Partidos"
                    description="Ver y editar partidos"
                    href="/admin/matches"
                    icon={Trophy}
                    iconBgColor="bg-blue-500/10"
                    iconColor="text-blue-500"
                  />
                  <QuickActionCard
                    title="Cargar Resultados"
                    description="Actualizar scores"
                    href="/admin/matches?filter=pending"
                    icon={FileEdit}
                    iconBgColor="bg-yellow-500/10"
                    iconColor="text-yellow-500"
                    badge={metrics.matches.pending > 0 ? metrics.matches.pending : undefined}
                    badgeVariant={metrics.matches.pending > 0 ? 'warning' : 'default'}
                  />
                  <QuickActionCard
                    title="Ver Usuarios"
                    description="Gestionar usuarios"
                    href="/admin/users"
                    icon={UserCog}
                    iconBgColor="bg-purple-500/10"
                    iconColor="text-purple-500"
                  />
                  <QuickActionCard
                    title="Recalcular Puntos"
                    description="Actualizar leaderboard"
                    href="/admin/settings?action=recalculate"
                    icon={RefreshCw}
                    iconBgColor="bg-green-500/10"
                    iconColor="text-green-500"
                  />
                </div>
              </div>

              {/* Actividad reciente */}
              <div>
                <h2 className="mb-4 text-xl font-semibold">Actividad Reciente</h2>
                <RecentActivity
                  users={metrics.recent.users}
                  predictions={metrics.recent.predictions}
                />
              </div>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  )
}
