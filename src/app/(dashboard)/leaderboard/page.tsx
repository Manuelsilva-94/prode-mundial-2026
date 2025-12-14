'use client'

import * as React from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Search, ArrowUpDown, User, Users } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LeaderboardView } from '@/components/leaderboard/LeaderboardView'
import { TeamLeaderboardTable } from '@/components/teams/TeamLeaderboardTable'
import { TeamLeaderboardCards } from '@/components/teams/TeamLeaderboardCards'
import { TeamDetailDialog } from '@/components/teams/TeamDetailDialog'
import { useLeaderboard } from '@/hooks/use-leaderboard'
import { useTeamsLeaderboard, TeamLeaderboardEntry } from '@/hooks/use-teams-leaderboard'
import { useMediaQuery } from '@/hooks/use-media-query'
import { ErrorMessage } from '@/components/ui/error-message'
import { EmptyState } from '@/components/ui/empty-state'
import { TableSkeleton } from '@/components/ui/skeletons'
import { PageHeader } from '@/components/ui/page-header'

type LeaderboardType = 'individual' | 'teams'

export default function LeaderboardPage() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const router = useRouter()
  const isDesktop = useMediaQuery('(min-width: 768px)')
  
  // Leer tab inicial desde query params
  const tabParam = searchParams.get('tab')
  const initialTab = tabParam === 'teams' ? 'teams' : 'individual'
  
  const [leaderboardType, setLeaderboardType] = React.useState<LeaderboardType>(initialTab)
  const [search, setSearch] = React.useState('')
  const [debouncedSearch, setDebouncedSearch] = React.useState('')
  const [page, setPage] = React.useState(1)
  const limit = 50

  // Team detail dialog
  const [selectedTeam, setSelectedTeam] = React.useState<TeamLeaderboardEntry | null>(null)
  const [teamDetailOpen, setTeamDetailOpen] = React.useState(false)

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)

    return () => clearTimeout(timer)
  }, [search])

  // Reset page and search when switching tabs, and update URL
  React.useEffect(() => {
    setSearch('')
    setDebouncedSearch('')
    setPage(1)
    
    // Actualizar URL sin recargar la página
    const newUrl = leaderboardType === 'teams' 
      ? '/leaderboard?tab=teams' 
      : '/leaderboard'
    router.replace(newUrl, { scroll: false })
  }, [leaderboardType, router])

  // Individual leaderboard
  const {
    data: individualData,
    isLoading: individualLoading,
    error: individualError,
    refetch: refetchIndividual,
  } = useLeaderboard({
    page,
    limit,
    search: debouncedSearch || undefined,
  })

  // Teams leaderboard
  const {
    data: teamsData,
    isLoading: teamsLoading,
    error: teamsError,
    refetch: refetchTeams,
  } = useTeamsLeaderboard({
    page,
    limit,
    search: debouncedSearch || undefined,
  })

  const entries = individualData?.data || []
  const personal = individualData?.personal
  const currentUserId = session?.user?.id

  // Scroll to current user position
  const scrollToCurrentUser = React.useCallback(() => {
    const desktopRow = document.getElementById('current-user-row')
    if (desktopRow) {
      desktopRow.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    const mobileCard = document.getElementById('current-user-card')
    if (mobileCard) {
      mobileCard.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [])

  // Add personal entry to entries if it exists and not in current page
  const allEntries = React.useMemo(() => {
    if (!personal || !currentUserId) return entries
    const existsInEntries = entries.some((e) => e.userId === currentUserId)
    if (existsInEntries) return entries
    return [...entries, personal]
  }, [entries, personal, currentUserId])

  const handleTeamClick = (team: TeamLeaderboardEntry) => {
    setSelectedTeam(team)
    setTeamDetailOpen(true)
  }

  const handleGoToMyTeam = () => {
    if (teamsData?.currentUserTeam) {
      const teamPage = Math.ceil(teamsData.currentUserTeam.ranking / limit)
      setPage(teamPage)
    }
  }

  const isLoading = leaderboardType === 'individual' ? individualLoading : teamsLoading
  const error = leaderboardType === 'individual' ? individualError : teamsError
  const refetch = leaderboardType === 'individual' ? refetchIndividual : refetchTeams
  const pagination = leaderboardType === 'individual' 
    ? individualData?.pagination 
    : teamsData?.pagination

  // Loading state
  if (isLoading && !(leaderboardType === 'individual' ? individualData : teamsData)) {
    return (
      <div className="container mx-auto space-y-8 px-4 py-8">
        <PageHeader
          title="Tabla de Posiciones"
          description="Ranking de participantes y equipos"
        />
        <div className="space-y-4">
          <Tabs value={leaderboardType} onValueChange={(v) => setLeaderboardType(v as LeaderboardType)}>
            <TabsList>
              <TabsTrigger value="individual" className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>Individual</span>
              </TabsTrigger>
              <TabsTrigger value="teams" className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Equipos</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar..." className="pl-9" disabled />
            </div>
          </div>
          <TableSkeleton rows={10} columns={6} />
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto space-y-8 px-4 py-8">
        <PageHeader
          title="Tabla de Posiciones"
          description="Ranking de participantes y equipos"
        />
        <Tabs value={leaderboardType} onValueChange={(v) => setLeaderboardType(v as LeaderboardType)}>
          <TabsList>
            <TabsTrigger value="individual" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Individual</span>
            </TabsTrigger>
            <TabsTrigger value="teams" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Equipos</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <ErrorMessage
          message={`Error al cargar el leaderboard de ${leaderboardType === 'individual' ? 'usuarios' : 'equipos'}.`}
          onRetry={() => refetch()}
        />
      </div>
    )
  }

  return (
    <div className="container mx-auto space-y-6 px-4 py-8">
      <PageHeader
        title="Tabla de Posiciones"
        description="Ranking de participantes y equipos"
        actions={
          leaderboardType === 'individual' ? (
            currentUserId && (personal || allEntries.some((e) => e.userId === currentUserId)) ? (
              <Button onClick={scrollToCurrentUser} variant="outline">
                <ArrowUpDown className="mr-2 h-4 w-4" />
                Ir a mi posición
              </Button>
            ) : null
          ) : (
            teamsData?.currentUserTeam ? (
              <Button onClick={handleGoToMyTeam} variant="outline">
                <Users className="mr-2 h-4 w-4" />
                Ir a mi equipo (#{teamsData.currentUserTeam.ranking})
              </Button>
            ) : null
          )
        }
      />

      {/* Toggle Individual / Equipos */}
      <Tabs value={leaderboardType} onValueChange={(v) => setLeaderboardType(v as LeaderboardType)}>
        <TabsList>
          <TabsTrigger value="individual" className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span>Individual</span>
          </TabsTrigger>
          <TabsTrigger value="teams" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Equipos</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={leaderboardType === 'individual' ? 'Buscar usuario...' : 'Buscar equipo...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Individual Leaderboard */}
      {leaderboardType === 'individual' && (
        <>
          {allEntries.length === 0 ? (
            <EmptyState
              icon={User}
              title="No hay resultados"
              description={
                debouncedSearch
                  ? `No se encontraron usuarios que coincidan con "${debouncedSearch}"`
                  : 'No hay participantes en el leaderboard aún'
              }
            />
          ) : (
            <LeaderboardView entries={allEntries} currentUserId={currentUserId} />
          )}
        </>
      )}

      {/* Teams Leaderboard */}
      {leaderboardType === 'teams' && (
        <>
          {!teamsData?.teams || teamsData.teams.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No hay equipos"
              description={
                debouncedSearch
                  ? `No se encontraron equipos con "${debouncedSearch}"`
                  : 'Aún no hay equipos registrados'
              }
            />
          ) : isDesktop ? (
            <TeamLeaderboardTable
              teams={teamsData.teams}
              currentUserTeamId={teamsData.currentUserTeam?.id}
              onTeamClick={handleTeamClick}
            />
          ) : (
            <TeamLeaderboardCards
              teams={teamsData.teams}
              currentUserTeamId={teamsData.currentUserTeam?.id}
              onTeamClick={handleTeamClick}
            />
          )}
        </>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-muted-foreground text-sm">
            Mostrando {(page - 1) * limit + 1} -{' '}
            {Math.min(page * limit, pagination.total)} de{' '}
            {pagination.total} {leaderboardType === 'individual' ? 'usuarios' : 'equipos'}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || isLoading}
            >
              Anterior
            </Button>
            <div className="text-muted-foreground text-sm">
              Página {page} de {pagination.totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages || isLoading}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      {/* Team Detail Dialog */}
      <TeamDetailDialog
        team={selectedTeam}
        open={teamDetailOpen}
        onOpenChange={setTeamDetailOpen}
      />
    </div>
  )
}
