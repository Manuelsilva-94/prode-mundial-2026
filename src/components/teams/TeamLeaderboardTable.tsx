'use client'

import * as React from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { RankingBadge } from '@/components/leaderboard/RankingBadge'
import { cn } from '@/lib/utils'
import { Users } from 'lucide-react'
import { TeamLeaderboardEntry } from '@/hooks/use-teams-leaderboard'

interface TeamLeaderboardTableProps {
  teams: TeamLeaderboardEntry[]
  currentUserTeamId?: string | null
  onTeamClick: (team: TeamLeaderboardEntry) => void
}

export function TeamLeaderboardTable({
  teams,
  currentUserTeamId,
  onTeamClick,
}: TeamLeaderboardTableProps) {
  const currentTeamRef = React.useRef<HTMLTableRowElement>(null)

  // Scroll al equipo del usuario cuando se monta
  React.useEffect(() => {
    if (currentTeamRef.current) {
      currentTeamRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }
  }, [currentUserTeamId])

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16 text-center">#</TableHead>
            <TableHead>Equipo</TableHead>
            <TableHead className="text-right">Promedio</TableHead>
            <TableHead className="text-right">Puntos Totales</TableHead>
            <TableHead className="w-24 text-center">Miembros</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teams.map((team) => {
            const isCurrentTeam = team.id === currentUserTeamId
            return (
              <TableRow
                key={team.id}
                ref={isCurrentTeam ? currentTeamRef : null}
                onClick={() => onTeamClick(team)}
                className={cn(
                  'cursor-pointer transition-colors hover:bg-muted/50',
                  isCurrentTeam && 'bg-primary/10 hover:bg-primary/15'
                )}
              >
                <TableCell className="text-center">
                  <RankingBadge ranking={team.ranking} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                      <Users className="text-primary h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-medium">{team.name}</div>
                      {team.description && (
                        <div className="text-muted-foreground max-w-xs truncate text-xs">
                          {team.description}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <span className="font-bold">
                    {team.averagePoints.toLocaleString()}
                  </span>
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {team.totalPoints.toLocaleString()}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center space-x-1">
                    <Users className="text-muted-foreground h-4 w-4" />
                    <span>{team.memberCount}</span>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

