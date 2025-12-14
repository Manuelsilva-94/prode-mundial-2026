'use client'

import { Card, CardContent } from '@/components/ui/card'
import { RankingBadge } from '@/components/leaderboard/RankingBadge'
import { cn } from '@/lib/utils'
import { Users, TrendingUp } from 'lucide-react'
import { TeamLeaderboardEntry } from '@/hooks/use-teams-leaderboard'

interface TeamLeaderboardCardsProps {
  teams: TeamLeaderboardEntry[]
  currentUserTeamId?: string | null
  onTeamClick: (team: TeamLeaderboardEntry) => void
}

export function TeamLeaderboardCards({
  teams,
  currentUserTeamId,
  onTeamClick,
}: TeamLeaderboardCardsProps) {
  return (
    <div className="space-y-3">
      {teams.map((team) => {
        const isCurrentTeam = team.id === currentUserTeamId
        return (
          <Card
            key={team.id}
            onClick={() => onTeamClick(team)}
            className={cn(
              'cursor-pointer transition-colors hover:bg-muted/50',
              isCurrentTeam && 'border-primary bg-primary/5'
            )}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <RankingBadge ranking={team.ranking} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="truncate font-semibold">{team.name}</span>
                      {isCurrentTeam && (
                        <span className="rounded bg-primary/20 px-1.5 py-0.5 text-xs text-primary">
                          Tu equipo
                        </span>
                      )}
                    </div>
                    {team.description && (
                      <p className="text-muted-foreground mt-0.5 truncate text-xs">
                        {team.description}
                      </p>
                    )}
                    <div className="mt-2 flex items-center space-x-3 text-xs text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Users className="h-3.5 w-3.5" />
                        <span>{team.memberCount} miembros</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center justify-end space-x-1">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    <span className="text-lg font-bold">
                      {team.averagePoints.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-muted-foreground text-xs">
                    promedio
                  </div>
                  <div className="text-muted-foreground mt-1 text-xs">
                    Total: {team.totalPoints.toLocaleString()}
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

