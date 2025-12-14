'use client'

import { memo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { UserAvatar } from './UserAvatar'
import { RankingBadge } from './RankingBadge'
import { cn } from '@/lib/utils'

interface LeaderboardEntry {
  id: string
  userId: string
  totalPoints: number
  totalPredictions: number
  correctPredictions: number
  exactScores: number
  ranking: number
  previousRanking: number | null
  rankingChange: number
  accuracyRate: number | string
  updatedAt: string
  user: {
    id: string
    name: string
    avatarUrl: string | null
  }
}

interface LeaderboardTableProps {
  entries: LeaderboardEntry[]
  currentUserId?: string
}

/**
 * LeaderboardTable - Memoizado para evitar re-renders en scroll/paginación
 */
export const LeaderboardTable = memo(function LeaderboardTable({
  entries,
  currentUserId,
}: LeaderboardTableProps) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16 text-center">Pos</TableHead>
            <TableHead>Usuario</TableHead>
            <TableHead className="text-right">Puntos</TableHead>
            <TableHead className="text-right">Correctas</TableHead>
            <TableHead className="text-right">Exactos</TableHead>
            <TableHead className="text-right">Acierto %</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry, index) => {
            const isCurrentUser = entry.userId === currentUserId
            return (
              <TableRow
                key={entry.id}
                id={isCurrentUser ? 'current-user-row' : undefined}
                data-current-user={isCurrentUser ? 'true' : undefined}
                className={cn(
                  isCurrentUser && 'bg-primary/10 font-medium',
                  index % 2 === 0 && !isCurrentUser && 'bg-muted/50'
                )}
              >
                <TableCell className="text-center">
                  <RankingBadge ranking={entry.ranking} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <UserAvatar
                      name={entry.user.name}
                      avatarUrl={entry.user.avatarUrl}
                    />
                    <span className="font-medium">{entry.user.name}</span>
                    {isCurrentUser && (
                      <span className="text-muted-foreground text-xs">(Tú)</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right font-semibold">
                  {entry.totalPoints.toLocaleString()}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {entry.correctPredictions}/{entry.totalPredictions}
                </TableCell>
                <TableCell className="text-right">
                  <span className="text-yellow-600 font-medium">
                    {entry.exactScores}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  {Number(entry.accuracyRate).toFixed(1)}%
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
})

LeaderboardTable.displayName = 'LeaderboardTable'

