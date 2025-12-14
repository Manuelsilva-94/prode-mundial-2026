'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { UserAvatar } from '@/components/leaderboard/UserAvatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Users,
  Trophy,
  Target,
  CheckCircle2,
  Calendar,
  Copy,
  Check,
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { TeamLeaderboardEntry } from '@/hooks/use-teams-leaderboard'
import { useQuery } from '@tanstack/react-query'

interface TeamDetailDialogProps {
  team: TeamLeaderboardEntry | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

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
    accuracyRate: number
    ranking: number
  }
}

interface TeamDetailResponse {
  team: {
    id: string
    name: string
    description: string | null
    inviteCode: string
    createdAt: string
    creator: {
      id: string
      name: string
      avatarUrl: string | null
    }
  }
  members: TeamMember[]
}

async function fetchTeamDetail(teamId: string): Promise<TeamDetailResponse> {
  const res = await fetch(`/api/teams/${teamId}`)
  if (!res.ok) {
    throw new Error('Failed to fetch team details')
  }
  return res.json()
}

export function TeamDetailDialog({
  team,
  open,
  onOpenChange,
}: TeamDetailDialogProps) {
  const [copied, setCopied] = React.useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['teamDetail', team?.id],
    queryFn: () => fetchTeamDetail(team!.id),
    enabled: !!team && open,
  })

  const handleCopyCode = async () => {
    if (team?.inviteCode) {
      await navigator.clipboard.writeText(team.inviteCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!team) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
              <Users className="text-primary h-5 w-5" />
            </div>
            <span>{team.name}</span>
          </DialogTitle>
          {team.description && (
            <DialogDescription>{team.description}</DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-6">
          {/* Estadísticas del equipo */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border p-3 text-center">
              <Trophy className="mx-auto mb-1 h-5 w-5 text-yellow-500" />
              <div className="text-xl font-bold">
                {team.totalPoints.toLocaleString()}
              </div>
              <div className="text-muted-foreground text-xs">Puntos Totales</div>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <Target className="mx-auto mb-1 h-5 w-5 text-blue-500" />
              <div className="text-xl font-bold">
                {team.averagePoints.toLocaleString()}
              </div>
              <div className="text-muted-foreground text-xs">Promedio</div>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <Users className="text-muted-foreground mx-auto mb-1 h-5 w-5" />
              <div className="text-xl font-bold">{team.memberCount}</div>
              <div className="text-muted-foreground text-xs">Miembros</div>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <CheckCircle2 className="mx-auto mb-1 h-5 w-5 text-green-500" />
              <div className="text-xl font-bold">{team.exactScores}</div>
              <div className="text-muted-foreground text-xs">Exactos</div>
            </div>
          </div>

          {/* Info del equipo */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Código de invitación:</span>
              <div className="flex items-center space-x-2">
                <code className="rounded bg-muted px-2 py-1 font-mono">
                  {team.inviteCode}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleCopyCode}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Creado:</span>
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  {format(new Date(team.createdAt), "d 'de' MMMM, yyyy", {
                    locale: es,
                  })}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Posición:</span>
              <Badge variant="secondary">#{team.ranking}</Badge>
            </div>
          </div>

          {/* Lista de miembros */}
          <div>
            <h4 className="mb-3 font-semibold">Miembros del Equipo</h4>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-3 p-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <Skeleton className="h-5 w-12" />
                  </div>
                ))}
              </div>
            ) : data?.members ? (
              <div className="space-y-2">
                {data.members
                  .sort((a, b) => b.stats.totalPoints - a.stats.totalPoints)
                  .map((member, index) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between rounded-lg border p-2"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <UserAvatar
                            name={member.user.name}
                            avatarUrl={member.user.avatarUrl}
                            className="h-8 w-8"
                          />
                          {index === 0 && (
                            <div className="absolute -right-1 -top-1 rounded-full bg-yellow-500 p-0.5">
                              <Trophy className="h-2.5 w-2.5 text-white" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">
                              {member.user.name}
                            </span>
                            {member.role === 'ADMIN' && (
                              <Badge variant="secondary" className="text-xs">
                                Admin
                              </Badge>
                            )}
                          </div>
                          <div className="text-muted-foreground text-xs">
                            {member.stats.correctPredictions}/
                            {member.stats.totalPredictions} correctas
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">
                          {member.stats.totalPoints.toLocaleString()}
                        </div>
                        <div className="text-muted-foreground text-xs">pts</div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

