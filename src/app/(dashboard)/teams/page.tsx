'use client'

import * as React from 'react'
import Link from 'next/link'
import { useMyTeam } from '@/hooks/use-my-team'
import { useQueryClient } from '@tanstack/react-query'
import { CreateTeamDialog } from '@/components/teams/CreateTeamDialog'
import { JoinTeamDialog } from '@/components/teams/JoinTeamDialog'
import { NoTeamView } from '@/components/teams/NoTeamView'
import { TeamView } from '@/components/teams/TeamView'
import { PageHeader } from '@/components/ui/page-header'
import { TeamViewSkeleton } from '@/components/ui/skeletons'
import { ErrorMessage } from '@/components/ui/error-message'
import { Button } from '@/components/ui/button'
import { Trophy } from 'lucide-react'

export default function TeamsPage() {
  const queryClient = useQueryClient()
  const { data, isLoading, isFetching, error, refetch } = useMyTeam()
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false)
  const [joinDialogOpen, setJoinDialogOpen] = React.useState(false)

  const handleDialogClose = React.useCallback((refresh: boolean) => {
    if (refresh) {
      // Invalidar la query para que se recargue y muestre skeleton
      queryClient.invalidateQueries({ queryKey: ['myTeam'] })
    }
  }, [queryClient])

  // Mostrar skeleton mientras está cargando inicialmente
  // NO mostrar skeleton durante isFetching si hay un modal abierto (para que los modales se muestren)
  const shouldShowSkeleton = isLoading || (isFetching && !createDialogOpen && !joinDialogOpen)

  if (shouldShowSkeleton) {
    return (
      <div className="container mx-auto space-y-8 px-4 py-8">
        <PageHeader
          title="Mi Equipo"
          description="Gestiona tu equipo y compite con tus amigos"
        />
        <TeamViewSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto space-y-8 px-4 py-8">
        <PageHeader
          title="Mi Equipo"
          description="Gestiona tu equipo y compite con tus amigos"
        />
        <ErrorMessage
          message="Error al cargar la información del equipo. Por favor, intenta de nuevo."
          onRetry={() => refetch()}
        />
      </div>
    )
  }

  const hasTeam = data?.team !== null

  return (
    <div className="container mx-auto space-y-8 px-4 py-8">
      <PageHeader
        title="Mi Equipo"
        description="Gestiona tu equipo y compite con tus amigos"
        actions={
          <Button asChild variant="outline">
            <Link href="/leaderboard?tab=teams">
              <Trophy className="mr-2 h-4 w-4" />
              Ranking de Equipos
            </Link>
          </Button>
        }
      />

      {hasTeam && data?.team && data?.membership ? (
        <TeamView
          team={data.team}
          membership={data.membership}
          members={data.members}
        />
      ) : (
        <NoTeamView
          onCreateTeam={() => setCreateDialogOpen(true)}
          onJoinTeam={() => setJoinDialogOpen(true)}
        />
      )}

      {/* Dialogs */}
      <CreateTeamDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={() => {
          handleDialogClose(true)
        }}
      />
      <JoinTeamDialog
        open={joinDialogOpen}
        onOpenChange={setJoinDialogOpen}
        onSuccess={() => {
          handleDialogClose(true)
        }}
      />
    </div>
  )
}

