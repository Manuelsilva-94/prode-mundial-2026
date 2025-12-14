'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useUserPublicProfile } from '@/hooks/use-user-public-profile'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UserAvatar } from '@/components/leaderboard/UserAvatar'
import { PageHeader } from '@/components/ui/page-header'
import { ProfileSkeleton } from '@/components/ui/skeletons'
import { ErrorMessage } from '@/components/ui/error-message'
import { StatCard } from '@/components/ui/stat-card'
import {
  Trophy,
  Target,
  CheckCircle2,
  Percent,
  Medal,
  Calendar,
  ArrowLeft,
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function UserProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const userId = params.id as string

  const { data, isLoading, error, refetch } = useUserPublicProfile(userId)

  // Si es el perfil propio, redirigir a /profile
  React.useEffect(() => {
    if (session?.user?.id && session.user.id === userId) {
      router.replace('/profile')
    }
  }, [session?.user?.id, userId, router])

  if (isLoading) {
    return (
      <div className="container mx-auto space-y-8 px-4 py-8">
        <ProfileSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto space-y-8 px-4 py-8">
        <PageHeader title="Perfil de Usuario" />
        <ErrorMessage
          message={error.message || 'Error al cargar el perfil del usuario'}
          onRetry={() => refetch()}
        />
      </div>
    )
  }

  if (!data) {
    return null
  }

  const { user, stats } = data

  return (
    <div className="container mx-auto space-y-8 px-4 py-8">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.back()}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver
      </Button>

      {/* User Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Perfil de Usuario</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center space-y-4 sm:flex-row sm:items-start sm:space-x-6 sm:space-y-0">
            <UserAvatar
              name={user.name}
              avatarUrl={user.avatarUrl}
              className="h-24 w-24 text-2xl"
            />
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-2xl font-bold">{user.name}</h2>
              <div className="mt-2 flex items-center justify-center space-x-2 text-muted-foreground sm:justify-start">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">
                  Miembro desde{' '}
                  {format(new Date(user.memberSince), "MMMM 'de' yyyy", {
                    locale: es,
                  })}
                </span>
              </div>
              {stats.ranking > 0 && (
                <div className="mt-2 flex items-center justify-center space-x-2 sm:justify-start">
                  <Medal className="h-5 w-5 text-yellow-500" />
                  <span className="font-semibold">
                    Posición #{stats.ranking} en el ranking
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div>
        <h2 className="mb-4 text-2xl font-semibold">Estadísticas</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Puntos Totales"
            value={stats.totalPoints.toLocaleString()}
            icon={Trophy}
          />
          <StatCard
            title="Predicciones"
            value={stats.totalPredictions.toString()}
            description={`${stats.correctPredictions} correctas`}
            icon={Target}
          />
          <StatCard
            title="Resultados Exactos"
            value={stats.exactScores.toString()}
            icon={CheckCircle2}
          />
          <StatCard
            title="Tasa de Acierto"
            value={`${Number(stats.accuracyRate).toFixed(1)}%`}
            icon={Percent}
          />
        </div>
      </div>
    </div>
  )
}

