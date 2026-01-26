'use client'

import { useState, useMemo } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { useAdminMatches } from '@/hooks/use-admin-matches'
import { MatchResultCard } from '@/components/admin/results/MatchResultCard'
import { ResultFilters } from '@/components/admin/results/ResultFilters'
import { BulkResultInput } from '@/components/admin/results/BulkResultInput'
import { ErrorMessage } from '@/components/ui/error-message'
import { EmptyState } from '@/components/ui/empty-state'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { startOfToday, startOfYesterday, endOfYesterday, isBefore } from 'date-fns'

type DateFilter = 'today' | 'yesterday' | 'pending' | 'all'

export default function AdminResultsPage() {
  const [dateFilter, setDateFilter] = useState<DateFilter>('pending')
  const [bulkInputOpen, setBulkInputOpen] = useState(false)

  // Obtener partidos (máximo 100 por request de la API)
  const {
    data: matchesData,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useAdminMatches({
    limit: 100, // Máximo permitido por la API
    orderBy: 'date',
    order: 'asc',
  })

  // Filtrar partidos según el filtro seleccionado
  const filteredMatches = useMemo(() => {
    if (!matchesData?.data) return []

    const now = new Date()
    const today = startOfToday()
    const yesterday = startOfYesterday()
    const yesterdayEnd = endOfYesterday()

    let matches = matchesData.data

    // Solo mostrar partidos LIVE o FINISHED (o SCHEDULED que ya pasaron)
    matches = matches.filter((match) => {
      const matchDate = new Date(match.matchDate)
      return (
        match.status === 'LIVE' ||
        match.status === 'FINISHED' ||
        (match.status === 'SCHEDULED' && isBefore(matchDate, now))
      )
    })

    // Aplicar filtro de fecha
    if (dateFilter === 'today') {
      matches = matches.filter((match) => {
        const matchDate = new Date(match.matchDate)
        return matchDate >= today && matchDate < now
      })
    } else if (dateFilter === 'yesterday') {
      matches = matches.filter((match) => {
        const matchDate = new Date(match.matchDate)
        return matchDate >= yesterday && matchDate <= yesterdayEnd
      })
    } else if (dateFilter === 'pending') {
      // Pendientes: partidos que ya deberían tener resultado pero no lo tienen
      matches = matches.filter((match) => {
        const matchDate = new Date(match.matchDate)
        const shouldHaveResult = isBefore(matchDate, now)
        const hasNoResult = match.homeScore === null || match.awayScore === null
        return shouldHaveResult && hasNoResult && match.status !== 'POSTPONED'
      })
    }
    // 'all' no filtra por fecha

    // Ordenar cronológicamente (más antiguos primero)
    matches.sort((a, b) => {
      return new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime()
    })

    return matches
  }, [matchesData?.data, dateFilter])

  const showSkeleton = isLoading || isFetching

  if (error) {
    return (
      <div className="flex min-h-screen">
        <AdminSidebar />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto px-4 py-8 lg:px-8">
            <PageHeader
              title="Cargar Resultados"
              description="Actualiza los resultados de los partidos y calcula puntos automáticamente"
            />
            <ErrorMessage
              message={error.message || 'Error al cargar los partidos'}
              onRetry={() => refetch()}
            />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto px-4 py-8 lg:px-8">
          <PageHeader
            title="Cargar Resultados"
            description="Actualiza los resultados de los partidos y calcula puntos automáticamente"
          />

          {/* Filtros */}
          <div className="mb-6">
            <ResultFilters
              dateFilter={dateFilter}
              onFilterChange={setDateFilter}
              onBulkInput={() => setBulkInputOpen(true)}
            />
          </div>

          {/* Lista de partidos */}
          {showSkeleton ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <Skeleton className="h-4 w-32" />
                      <div className="grid grid-cols-12 gap-4">
                        <Skeleton className="col-span-5 h-12" />
                        <Skeleton className="col-span-2 h-12" />
                        <Skeleton className="col-span-5 h-12" />
                      </div>
                      <Skeleton className="h-10 w-32 ml-auto" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredMatches.length === 0 ? (
            <EmptyState
              title="No hay partidos"
              description={
                dateFilter === 'pending'
                  ? 'No hay partidos pendientes de resultado'
                  : `No hay partidos para el filtro "${dateFilter}"`
              }
            />
          ) : (
            <div className="space-y-4">
              {filteredMatches.map((match) => (
                <MatchResultCard
                  key={match.id}
                  match={match}
                  onSuccess={() => refetch()}
                />
              ))}
            </div>
          )}

          {/* Estadísticas rápidas */}
          {!showSkeleton && (
            <div className="mt-8 rounded-lg bg-muted p-4">
              <p className="text-sm text-muted-foreground">
                {filteredMatches.length > 0 ? (
                  <>
                    Mostrando {filteredMatches.length} partido
                    {filteredMatches.length !== 1 ? 's' : ''}
                    {dateFilter === 'pending' &&
                      ` (${filteredMatches.filter((m) => m._count.predictions > 0).length} con predicciones)`}
                    {matchesData?.pagination.total && matchesData.pagination.total > 100 && (
                      <span className="ml-2 text-yellow-600">
                        (Mostrando máximo 100 de {matchesData.pagination.total} partidos disponibles)
                      </span>
                    )}
                  </>
                ) : (
                  'No hay partidos para mostrar'
                )}
              </p>
            </div>
          )}

          {/* Dialog de carga masiva */}
          <BulkResultInput
            open={bulkInputOpen}
            onOpenChange={setBulkInputOpen}
            matches={filteredMatches}
            onSuccess={() => refetch()}
          />
        </div>
      </main>
    </div>
  )
}
