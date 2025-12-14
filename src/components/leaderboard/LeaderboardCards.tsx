'use client'

import { Card, CardContent } from '@/components/ui/card'
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

interface LeaderboardCardsProps {
  entries: LeaderboardEntry[]
  currentUserId?: string
}

export function LeaderboardCards({
  entries,
  currentUserId,
}: LeaderboardCardsProps) {
  return (
    <div className="space-y-3">
      {entries.map((entry) => {
        const isCurrentUser = entry.userId === currentUserId
        return (
          <Card
            key={entry.id}
            id={isCurrentUser ? 'current-user-card' : undefined}
            data-current-user={isCurrentUser ? 'true' : undefined}
            className={cn(
              isCurrentUser && 'border-primary border-2 bg-primary/5'
            )}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  <RankingBadge ranking={entry.ranking} />
                  <UserAvatar
                    name={entry.user.name}
                    avatarUrl={entry.user.avatarUrl}
                    className="h-10 w-10"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium truncate">
                        {entry.user.name}
                      </span>
                      {isCurrentUser && (
                        <span className="text-primary text-xs font-semibold">
                          (Tú)
                        </span>
                      )}
                    </div>
                    <div className="text-muted-foreground text-xs mt-1">
                      {entry.correctPredictions}/{entry.totalPredictions}{' '}
                      correctas • {entry.exactScores} exactos
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">
                    {entry.totalPoints.toLocaleString()}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {Number(entry.accuracyRate).toFixed(1)}% acierto
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

