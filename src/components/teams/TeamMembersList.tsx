'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UserAvatar } from '@/components/leaderboard/UserAvatar'
import { Badge } from '@/components/ui/badge'
import { Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TeamMember {
  id: string
  role: 'ADMIN' | 'MEMBER'
  joinedAt: string
  user: {
    id: string
    name: string
    email: string
    avatarUrl: string | null
  }
  stats: {
    totalPoints: number
    totalPredictions: number
    correctPredictions: number
    exactScores: number
    accuracyRate: number | string
  }
}

interface TeamMembersListProps {
  members: TeamMember[]
  currentUserId?: string
}

export function TeamMembersList({
  members,
  currentUserId,
}: TeamMembersListProps) {
  const router = useRouter()

  // Ordenar por puntos (descendente)
  const sortedMembers = React.useMemo(() => {
    return [...members].sort((a, b) => b.stats.totalPoints - a.stats.totalPoints)
  }, [members])

  const handleMemberClick = (userId: string) => {
    router.push(`/users/${userId}`)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Miembros del Equipo</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {sortedMembers.map((member, index) => {
            const isCurrentUser = member.user.id === currentUserId
            const isTopScorer = index === 0
            return (
              <div
                key={member.id}
                onClick={() => handleMemberClick(member.user.id)}
                className={cn(
                  'flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50',
                  isCurrentUser && 'border-primary bg-primary/5 hover:bg-primary/10'
                )}
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="relative">
                    <UserAvatar
                      name={member.user.name}
                      avatarUrl={member.user.avatarUrl}
                      className="h-10 w-10"
                    />
                    {isTopScorer && (
                      <div className="absolute -right-1 -top-1 rounded-full bg-yellow-500 p-0.5">
                        <Trophy className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium truncate hover:underline">
                        {member.user.name}
                      </span>
                      {member.role === 'ADMIN' && (
                        <Badge variant="secondary" className="text-xs">
                          Admin
                        </Badge>
                      )}
                      {isCurrentUser && (
                        <Badge variant="outline" className="text-xs">
                          Tú
                        </Badge>
                      )}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {member.stats.correctPredictions}/
                      {member.stats.totalPredictions} correctas •{' '}
                      {Number(member.stats.accuracyRate).toFixed(1)}% acierto
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">
                    {member.stats.totalPoints.toLocaleString()}
                  </div>
                  <div className="text-muted-foreground text-xs">puntos</div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

