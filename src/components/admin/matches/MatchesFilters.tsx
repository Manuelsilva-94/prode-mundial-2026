'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Search, X, Plus } from 'lucide-react'
import { useAdminPhases } from '@/hooks/use-admin-phases'
import { useDebounce } from '@/hooks/use-debounce'

interface MatchesFiltersProps {
  onFilterChange: (filters: {
    phaseId?: string
    status?: string
    search?: string
  }) => void
  onCreateNew: () => void
}

const statusOptions = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'SCHEDULED', label: 'Programados' },
  { value: 'LIVE', label: 'En vivo' },
  { value: 'FINISHED', label: 'Finalizados' },
  { value: 'POSTPONED', label: 'Pospuestos' },
]

export function MatchesFilters({ onFilterChange, onCreateNew }: MatchesFiltersProps) {
  const { data: phasesData } = useAdminPhases()
  const [search, setSearch] = useState('')
  const [phaseId, setPhaseId] = useState<string>('all')
  const [status, setStatus] = useState<string>('all')

  const debouncedSearch = useDebounce(search, 300)

  useEffect(() => {
    onFilterChange({
      phaseId: phaseId === 'all' ? undefined : phaseId,
      status: status === 'all' ? undefined : status,
      search: debouncedSearch || undefined,
    })
  }, [phaseId, status, debouncedSearch, onFilterChange])

  const clearFilters = () => {
    setSearch('')
    setPhaseId('all')
    setStatus('all')
  }

  const hasActiveFilters = search || phaseId !== 'all' || status !== 'all'

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
        {/* Búsqueda */}
        <div className="relative w-full sm:max-w-xs">
          <label htmlFor="match-search" className="sr-only">
            Buscar partidos por equipo
          </label>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            id="match-search"
            type="search"
            placeholder="Buscar por equipo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            aria-label="Buscar partidos por nombre de equipo"
          />
        </div>

        {/* Filtro por fase */}
        <Select value={phaseId} onValueChange={setPhaseId}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Fase" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las fases</SelectItem>
            {phasesData?.data.map((phase) => (
              <SelectItem key={phase.id} value={phase.id}>
                {phase.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filtro por estado */}
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Limpiar filtros */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-11 sm:h-10 px-3 min-h-[44px] sm:min-h-0"
          >
            <X className="mr-1 h-4 w-4" />
            Limpiar
          </Button>
        )}
      </div>

      {/* Botón crear */}
      <Button onClick={onCreateNew} className="w-full sm:w-auto h-11 sm:h-10 min-h-[44px] sm:min-h-0">
        <Plus className="mr-2 h-4 w-4" />
        Nuevo Partido
      </Button>
    </div>
  )
}

