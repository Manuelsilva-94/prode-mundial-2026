'use client'

import { format, isToday, isBefore } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Lock,
  ClipboardList,
} from 'lucide-react'
import type { AdminMatch } from '@/hooks/use-admin-matches'
import { cn } from '@/lib/utils'

interface MatchesTableProps {
  matches: AdminMatch[]
  onEdit: (match: AdminMatch) => void
  onDelete: (match: AdminMatch) => void
  onViewPredictions?: (match: AdminMatch) => void
}

const statusConfig = {
  SCHEDULED: { label: 'Programado', variant: 'secondary' as const },
  LIVE: { label: 'En vivo', variant: 'destructive' as const },
  FINISHED: { label: 'Finalizado', variant: 'default' as const },
  POSTPONED: { label: 'Pospuesto', variant: 'outline' as const },
}

export function MatchesTable({
  matches,
  onEdit,
  onDelete,
  onViewPredictions,
}: MatchesTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">Fecha</TableHead>
            <TableHead>Partido</TableHead>
            <TableHead>Fase</TableHead>
            <TableHead>Resultado</TableHead>
            <TableHead className="text-center">Estado</TableHead>
            <TableHead className="text-center">Predicciones</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {matches.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                No se encontraron partidos
              </TableCell>
            </TableRow>
          ) : (
            matches.map((match) => {
              const matchDate = new Date(match.matchDate)
              const isMatchToday = isToday(matchDate)
              const isLocked = match.isLocked || isBefore(new Date(match.lockTime), new Date())
              const status = statusConfig[match.status]

              return (
                <TableRow
                  key={match.id}
                  className={cn(isMatchToday && 'bg-amber-50 dark:bg-amber-950/20')}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {isLocked && (
                        <Lock className="h-3 w-3 text-muted-foreground" />
                      )}
                      <div>
                        <div className="font-medium">
                          {format(matchDate, 'dd MMM yyyy', { locale: es })}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(matchDate, 'HH:mm', { locale: es })} hs
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <img
                          src={match.homeTeam.flagUrl}
                          alt={match.homeTeam.name}
                          className="h-5 w-7 rounded object-cover"
                        />
                        <span className="font-medium">{match.homeTeam.code}</span>
                      </div>
                      <span className="text-muted-foreground">vs</span>
                      <div className="flex items-center gap-2">
                        <img
                          src={match.awayTeam.flagUrl}
                          alt={match.awayTeam.name}
                          className="h-5 w-7 rounded object-cover"
                        />
                        <span className="font-medium">{match.awayTeam.code}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{match.phase.name}</div>
                      {match.groupLetter && (
                        <div className="text-sm text-muted-foreground">
                          Grupo {match.groupLetter}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {match.status === 'FINISHED' ||
                    match.status === 'LIVE' ? (
                      <span className="text-lg font-bold">
                        {match.homeScore ?? '-'} - {match.awayScore ?? '-'}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="font-mono">
                      {match._count.predictions}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Abrir menú</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(match)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        {onViewPredictions && match._count.predictions > 0 && (
                          <DropdownMenuItem
                            onClick={() => onViewPredictions(match)}
                          >
                            <ClipboardList className="mr-2 h-4 w-4" />
                            Ver predicciones
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDelete(match)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}

