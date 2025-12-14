'use client'

import * as React from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TeamMembersList } from './TeamMembersList'
import { UserAvatar } from '@/components/leaderboard/UserAvatar'
import { Copy, Check, LogOut, Users, Trophy, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { useLeaveTeam } from '@/hooks/use-leave-team'
import { useSession } from 'next-auth/react'

interface TeamViewProps {
  team: {
    id: string
    name: string
    description: string | null
    inviteCode: string
    creator: {
      id: string
      name: string
      email: string
      avatarUrl: string | null
    }
    createdAt: string
    updatedAt: string
    ranking: number
    totalTeams: number
    averagePoints: number
  }
  membership: {
    id: string
    role: 'ADMIN' | 'MEMBER'
    joinedAt: string
    isCreator: boolean
  }
  members: Array<{
    id: string
    userId: string
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
  }>
}

export function TeamView({ team, membership, members }: TeamViewProps) {
  const { data: session } = useSession()
  const leaveTeam = useLeaveTeam()
  const [showLeaveDialog, setShowLeaveDialog] = React.useState(false)
  const [copied, setCopied] = React.useState(false)

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(team.inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleLeave = async () => {
    try {
      await leaveTeam.mutateAsync(team.id)
      // El modal se cerrará automáticamente cuando isPending se vuelva false
      // y la query se invalidará en el hook onSuccess
    } catch (error) {
      // Error handled by hook
      console.error('Error leaving team:', error)
    }
  }

  // Cerrar el modal cuando la mutación termine exitosamente
  React.useEffect(() => {
    if (leaveTeam.isSuccess && !leaveTeam.isPending && showLeaveDialog) {
      // Pequeño delay para que el usuario vea el estado de éxito
      const timer = setTimeout(() => {
        setShowLeaveDialog(false)
      }, 100)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [leaveTeam.isSuccess, leaveTeam.isPending, showLeaveDialog])

  const totalTeamPoints = members.reduce(
    (sum, member) => sum + member.stats.totalPoints,
    0
  )

  return (
    <div className="space-y-6">
      {/* Team Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="mb-2 flex items-center space-x-3">
                <Users className="text-muted-foreground h-6 w-6" />
                <CardTitle className="text-2xl">{team.name}</CardTitle>
              </div>
              {team.description && (
                <CardDescription className="mt-2 text-base">
                  {team.description}
                </CardDescription>
              )}
            </div>
            <div className="flex items-center space-x-6">
              {/* Ranking */}
              <Link
                href="/leaderboard?tab=teams"
                className="group text-center transition-colors hover:opacity-80"
              >
                <div className="flex items-center justify-center space-x-1">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  <span className="text-2xl font-bold">#{team.ranking}</span>
                </div>
                <div className="text-muted-foreground text-xs group-hover:underline">
                  de {team.totalTeams} equipos
                </div>
              </Link>
              
              {/* Promedio */}
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  <span className="text-2xl font-bold">
                    {team.averagePoints.toLocaleString()}
                  </span>
                </div>
                <div className="text-muted-foreground text-xs">
                  promedio
                </div>
              </div>

              {/* Total */}
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {totalTeamPoints.toLocaleString()}
                </div>
                <div className="text-muted-foreground text-xs">
                  puntos totales
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Invite Code */}
          <div className="space-y-2">
            <Label>Código de invitación</Label>
            <div className="flex items-center space-x-2">
              <Input
                value={team.inviteCode}
                readOnly
                className="font-mono text-lg font-bold"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleCopyCode}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-muted-foreground text-xs">
              Comparte este código para que otros puedan unirse al equipo
            </p>
          </div>

          {/* Creator Info */}
          <div className="flex items-center space-x-2 text-sm">
            <UserAvatar
              name={team.creator.name}
              avatarUrl={team.creator.avatarUrl}
              className="h-8 w-8"
            />
            <span className="text-muted-foreground">
              Creado por{' '}
              <span className="font-medium">{team.creator.name}</span>
            </span>
          </div>

          {/* Leave Button */}
          <Button
            variant="destructive"
            onClick={() => {
              // Resetear el estado de la mutación cuando se abre el modal
              if (leaveTeam.isSuccess) {
                leaveTeam.reset()
              }
              setShowLeaveDialog(true)
            }}
            className="w-full sm:w-auto"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Salir del Equipo
          </Button>
        </CardContent>
      </Card>

      {/* Members List */}
      <TeamMembersList members={members} currentUserId={session?.user?.id} />

      {/* Leave Confirmation Dialog */}
      <ConfirmDialog
        open={showLeaveDialog}
        onOpenChange={(open) => {
          // Prevenir que se cierre mientras está procesando o si fue exitoso (se cerrará con useEffect)
          if (!open && (leaveTeam.isPending || leaveTeam.isSuccess)) {
            return
          }
          setShowLeaveDialog(open)
        }}
        title="Salir del equipo"
        description={
          membership.isCreator
            ? '¿Estás seguro de que quieres salir del equipo? Si eres el único miembro, el equipo será eliminado. Si hay otros miembros, el ownership será transferido al miembro más antiguo.'
            : '¿Estás seguro de que quieres salir del equipo? Esta acción no se puede deshacer.'
        }
        variant="destructive"
        confirmLabel="Salir"
        cancelLabel="Cancelar"
        onConfirm={handleLeave}
        isLoading={leaveTeam.isPending}
      />
    </div>
  )
}
