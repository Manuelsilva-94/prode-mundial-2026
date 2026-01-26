'use client'

import { Button } from '@/components/ui/button'
import { Calendar, CalendarDays, Clock, Upload } from 'lucide-react'

type DateFilter = 'today' | 'yesterday' | 'pending' | 'all'

interface ResultFiltersProps {
  dateFilter: DateFilter
  onFilterChange: (filter: DateFilter) => void
  onBulkInput?: () => void
}

export function ResultFilters({
  dateFilter,
  onFilterChange,
  onBulkInput,
}: ResultFiltersProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2" role="group" aria-label="Filtros de resultados">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={dateFilter === 'today' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onFilterChange('today')}
          className="flex items-center gap-2"
          aria-pressed={dateFilter === 'today'}
          aria-label="Filtrar partidos de hoy"
        >
          <Calendar className="h-4 w-4" aria-hidden="true" />
          Hoy
        </Button>
        <Button
          variant={dateFilter === 'yesterday' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onFilterChange('yesterday')}
          className="flex items-center gap-2"
          aria-pressed={dateFilter === 'yesterday'}
          aria-label="Filtrar partidos de ayer"
        >
          <CalendarDays className="h-4 w-4" aria-hidden="true" />
          Ayer
        </Button>
        <Button
          variant={dateFilter === 'pending' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onFilterChange('pending')}
          className="flex items-center gap-2"
          aria-pressed={dateFilter === 'pending'}
          aria-label="Filtrar partidos pendientes"
        >
          <Clock className="h-4 w-4" aria-hidden="true" />
          Pendientes
        </Button>
        <Button
          variant={dateFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onFilterChange('all')}
          aria-pressed={dateFilter === 'all'}
          aria-label="Mostrar todos los partidos"
        >
          Todos
        </Button>
      </div>
      {onBulkInput && (
        <Button
          variant="outline"
          size="sm"
          onClick={onBulkInput}
          className="flex items-center gap-2"
          aria-label="Abrir diálogo de carga masiva de resultados"
        >
          <Upload className="h-4 w-4" aria-hidden="true" />
          Carga Masiva
        </Button>
      )}
    </div>
  )
}
