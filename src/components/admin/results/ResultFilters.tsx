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
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap items-center gap-2">
      <Button
        variant={dateFilter === 'today' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onFilterChange('today')}
        className="flex items-center gap-2"
      >
        <Calendar className="h-4 w-4" />
        Hoy
      </Button>
      <Button
        variant={dateFilter === 'yesterday' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onFilterChange('yesterday')}
        className="flex items-center gap-2"
      >
        <CalendarDays className="h-4 w-4" />
        Ayer
      </Button>
      <Button
        variant={dateFilter === 'pending' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onFilterChange('pending')}
        className="flex items-center gap-2"
      >
        <Clock className="h-4 w-4" />
        Pendientes
      </Button>
      <Button
        variant={dateFilter === 'all' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onFilterChange('all')}
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
        >
          <Upload className="h-4 w-4" />
          Carga Masiva
        </Button>
      )}
    </div>
  )
}
