'use client'

import * as React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MatchCard } from '@/components/matches/MatchCard'
import { useMatches } from '@/hooks/use-matches'
import { usePhases } from '@/hooks/use-phases'
import { ErrorMessage } from '@/components/ui/error-message'
import { EmptyState } from '@/components/ui/empty-state'
import { NoMatchesEmptyState } from '@/components/ui/empty-states'
import { MatchCardSkeleton } from '@/components/ui/skeletons'
import { Calendar, CalendarDays, CalendarRange } from 'lucide-react'
import { startOfToday, addDays } from 'date-fns'

type DateFilter = 'today' | 'tomorrow' | 'all'

export default function HomePage() {
  const { data: phasesData } = usePhases()
  const [selectedPhase, setSelectedPhase] = React.useState<string>('all')
  const [dateFilter, setDateFilter] = React.useState<DateFilter>('all')

  const phases = React.useMemo(() => phasesData || [], [phasesData])

  // Calcular fechas para filtro
  const today = startOfToday()
  const tomorrow = addDays(today, 1)
  const tomorrowEnd = addDays(tomorrow, 1)

  const getDateFilter = (): { dateFrom?: string; dateTo?: string } => {
    if (dateFilter === 'today') {
      return {
        dateFrom: today.toISOString(),
        dateTo: tomorrow.toISOString(),
      }
    }
    if (dateFilter === 'tomorrow') {
      return {
        dateFrom: tomorrow.toISOString(),
        dateTo: tomorrowEnd.toISOString(),
      }
    }
    return {}
  }

  // Obtener phaseId si hay un phaseSlug seleccionado
  const selectedPhaseId = React.useMemo(() => {
    if (selectedPhase === 'all') return undefined
    const phase = phases.find((p) => p.slug === selectedPhase)
    return phase?.id
  }, [selectedPhase, phases])

  const {
    data: matchesData,
    isLoading,
    error,
    refetch,
  } = useMatches({
    phase: selectedPhaseId,
    ...getDateFilter(),
    limit: 50, // Límite máximo permitido por la API
  })

  // Agrupar matches por fase
  const matchesByPhase = React.useMemo(() => {
    const matches = matchesData?.matches || []
    const grouped: Record<string, typeof matches> = {}
    matches.forEach((match) => {
      const slug = match.phase.slug
      if (!grouped[slug]) {
        grouped[slug] = []
      }
      grouped[slug].push(match)
    })

    // Ordenar matches dentro de cada fase por fecha
    Object.keys(grouped).forEach((slug) => {
      grouped[slug].sort(
        (a, b) =>
          new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime()
      )
    })

    return grouped
  }, [matchesData?.matches])

  // Fases ordenadas por sortOrder, filtrar solo las que tienen matches
  const sortedPhases = React.useMemo(() => {
    const phasesWithMatches = phases
      .filter((phase) => {
        const phaseMatches = matchesByPhase[phase.slug] || []
        return phaseMatches.length > 0
      })
      .sort((a, b) => a.sortOrder - b.sortOrder)
    return phasesWithMatches
  }, [phases, matchesByPhase])

  if (isLoading && !matchesData) {
    return (
      <div className="container mx-auto space-y-8 px-4 py-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fixture</h1>
          <p className="text-muted-foreground mt-2">
            Visualiza y predice los partidos del torneo
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <MatchCardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto space-y-8 px-4 py-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fixture</h1>
          <p className="text-muted-foreground mt-2">
            Visualiza y predice los partidos del torneo
          </p>
        </div>
        <ErrorMessage
          title="Error al cargar los partidos"
          message="No se pudieron cargar los partidos. Por favor, intenta de nuevo."
          onRetry={() => refetch()}
          type="network"
        />
      </div>
    )
  }

  return (
    <div className="container mx-auto space-y-8 px-4 py-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Fixture</h1>
        <p className="text-muted-foreground mt-2">
          Visualiza y predice los partidos del torneo
        </p>
      </header>

      {/* Filtros */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        {/* Filtro por fecha */}
        <div className="flex items-center gap-2 flex-wrap" role="group" aria-label="Filtros de fecha">
          <button
            onClick={() => setDateFilter('today')}
            className={`flex items-center justify-center gap-1.5 rounded-md px-4 py-2.5 text-base font-medium transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
              dateFilter === 'today'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
            aria-pressed={dateFilter === 'today'}
            aria-label="Filtrar partidos de hoy"
          >
            <Calendar className="h-4 w-4" aria-hidden="true" />
            <span>Hoy</span>
          </button>
          <button
            onClick={() => setDateFilter('tomorrow')}
            className={`flex items-center justify-center gap-1.5 rounded-md px-4 py-2.5 text-base font-medium transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
              dateFilter === 'tomorrow'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
            aria-pressed={dateFilter === 'tomorrow'}
            aria-label="Filtrar partidos de mañana"
          >
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            <span>Mañana</span>
          </button>
          <button
            onClick={() => setDateFilter('all')}
            className={`flex items-center justify-center gap-1.5 rounded-md px-4 py-2.5 text-base font-medium transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
              dateFilter === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
            aria-pressed={dateFilter === 'all'}
            aria-label="Mostrar todos los partidos"
          >
            <CalendarRange className="h-4 w-4" aria-hidden="true" />
            <span>Todos</span>
          </button>
        </div>
      </div>

      {/* Tabs por fase */}
      {phases.length > 0 && sortedPhases.length > 0 ? (
        <Tabs
          defaultValue={sortedPhases[0]?.slug || 'all'}
          className="w-full"
          onValueChange={(value) => setSelectedPhase(value)}
        >
          <TabsList className="mb-6 grid w-full grid-cols-2 overflow-x-auto sm:grid-cols-3 lg:grid-cols-6">
            {sortedPhases.map((phase) => {
              const phaseMatches = matchesByPhase[phase.slug] || []
              return (
                <TabsTrigger
                  key={phase.id}
                  value={phase.slug}
                  className="relative"
                >
                  {phase.name}
                  {phaseMatches.length > 0 && (
                    <span className="bg-primary text-primary-foreground ml-2 rounded-full px-2 py-0.5 text-xs">
                      {phaseMatches.length}
                    </span>
                  )}
                </TabsTrigger>
              )
            })}
          </TabsList>

          {sortedPhases.map((phase) => {
            const phaseMatches = matchesByPhase[phase.slug] || []
            return (
              <TabsContent key={phase.id} value={phase.slug} className="mt-0">
                {phaseMatches.length === 0 ? (
                  <EmptyState
                    title="No hay partidos"
                    description={`No hay partidos programados en ${phase.name} para el filtro seleccionado.`}
                  />
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {phaseMatches.map((match) => (
                      <MatchCard key={match.id} match={match} />
                    ))}
                  </div>
                )}
              </TabsContent>
            )
          })}
        </Tabs>
      ) : (
        <NoMatchesEmptyState />
      )}
    </div>
  )
}
