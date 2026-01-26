'use client'

import { useState, useCallback } from 'react'
import { PageHeader } from '@/components/ui/page-header'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { useAdminMatches, AdminMatch } from '@/hooks/use-admin-matches'
import { MatchesTable } from '@/components/admin/matches/MatchesTable'
import { MatchesFilters } from '@/components/admin/matches/MatchesFilters'
import { MatchesPagination } from '@/components/admin/matches/MatchesPagination'
import { MatchFormDialog } from '@/components/admin/matches/MatchFormDialog'
import { DeleteMatchDialog } from '@/components/admin/matches/DeleteMatchDialog'
import { MatchPredictionsDialog } from '@/components/admin/matches/MatchPredictionsDialog'
import { ErrorMessage } from '@/components/ui/error-message'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'

export default function AdminMatchesPage() {
  // Estado de filtros y paginación
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [filters, setFilters] = useState<{
    phaseId?: string
    status?: string
    search?: string
  }>({})

  // Estado de modales
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editingMatch, setEditingMatch] = useState<AdminMatch | null>(null)
  const [deletingMatch, setDeletingMatch] = useState<AdminMatch | null>(null)
  const [viewingPredictions, setViewingPredictions] = useState<AdminMatch | null>(null)

  // Query de partidos
  const { data, isLoading, isFetching, error, refetch } = useAdminMatches({
    page,
    limit,
    ...filters,
    orderBy: 'date',
    order: 'asc',
  })

  // Mostrar skeleton durante carga inicial o refetch
  const showSkeleton = isLoading || isFetching

  // Handlers
  const handleFilterChange = useCallback((newFilters: typeof filters) => {
    setFilters(newFilters)
    setPage(1) // Reset a página 1 cuando cambian los filtros
  }, [])

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit)
    setPage(1)
  }

  const handleEdit = (match: AdminMatch) => {
    setEditingMatch(match)
  }

  const handleDelete = (match: AdminMatch) => {
    setDeletingMatch(match)
  }

  const handleViewPredictions = (match: AdminMatch) => {
    setViewingPredictions(match)
  }

  const handleCreateSuccess = () => {
    toast.success('Partido creado correctamente')
    refetch()
  }

  const handleEditSuccess = () => {
    toast.success('Partido actualizado correctamente')
    setEditingMatch(null)
    refetch()
  }

  const handleDeleteSuccess = () => {
    toast.success('Partido eliminado correctamente')
    setDeletingMatch(null)
    refetch()
  }

  if (error) {
    return (
      <div className="flex min-h-screen">
        <AdminSidebar />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto px-4 py-8 lg:px-8">
            <PageHeader
              title="Gestión de Partidos"
              description="Administra los partidos del torneo"
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
            title="Gestión de Partidos"
            description="Crea, edita y elimina partidos del torneo"
          />

          {/* Filtros */}
          <MatchesFilters
            onFilterChange={handleFilterChange}
            onCreateNew={() => setCreateDialogOpen(true)}
          />

          {/* Tabla */}
          {showSkeleton ? (
            <Card>
              <CardContent className="p-0">
                <div className="space-y-3 p-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-24" />
                      <Skeleton className="h-12 flex-1" />
                      <Skeleton className="h-12 w-32" />
                      <Skeleton className="h-12 w-20" />
                      <Skeleton className="h-12 w-24" />
                      <Skeleton className="h-12 w-20" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <MatchesTable
              matches={data?.data || []}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onViewPredictions={handleViewPredictions}
            />
          )}

          {/* Paginación */}
          {!showSkeleton && data && data.pagination.total > 0 && (
            <MatchesPagination
              page={data.pagination.page}
              totalPages={data.pagination.totalPages}
              total={data.pagination.total}
              limit={data.pagination.limit}
              onPageChange={handlePageChange}
              onLimitChange={handleLimitChange}
            />
          )}

          {/* Modal Crear */}
          <MatchFormDialog
            open={createDialogOpen}
            onOpenChange={setCreateDialogOpen}
            onSuccess={handleCreateSuccess}
          />

          {/* Modal Editar */}
          <MatchFormDialog
            open={!!editingMatch}
            onOpenChange={(open) => !open && setEditingMatch(null)}
            match={editingMatch}
            onSuccess={handleEditSuccess}
          />

          {/* Dialog Eliminar */}
          <DeleteMatchDialog
            open={!!deletingMatch}
            onOpenChange={(open) => !open && setDeletingMatch(null)}
            match={deletingMatch}
            onSuccess={handleDeleteSuccess}
          />

          {/* Dialog Ver Predicciones */}
          <MatchPredictionsDialog
            open={!!viewingPredictions}
            onOpenChange={(open) => !open && setViewingPredictions(null)}
            match={viewingPredictions}
          />
        </div>
      </main>
    </div>
  )
}
