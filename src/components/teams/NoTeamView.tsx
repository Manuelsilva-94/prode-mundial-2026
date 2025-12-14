'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Plus, UserPlus } from 'lucide-react'

interface NoTeamViewProps {
  onCreateTeam: () => void
  onJoinTeam: () => void
}

export function NoTeamView({ onCreateTeam, onJoinTeam }: NoTeamViewProps) {
  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Users className="h-8 w-8 text-muted-foreground" />
        </div>
        <CardTitle className="text-2xl">No estás en ningún equipo</CardTitle>
        <CardDescription className="text-base">
          Crea un equipo o únete a uno existente para competir junto a tus
          amigos y ver quién hace las mejores predicciones.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Button
            onClick={onCreateTeam}
            className="h-auto flex-col py-6 space-y-2"
            size="lg"
          >
            <Plus className="h-6 w-6" />
            <span>Crear Equipo</span>
            <span className="text-xs opacity-90">
              Crea tu propio equipo y comparte el código
            </span>
          </Button>
          <Button
            onClick={onJoinTeam}
            variant="outline"
            className="h-auto flex-col py-6 space-y-2"
            size="lg"
          >
            <UserPlus className="h-6 w-6" />
            <span>Unirse a Equipo</span>
            <span className="text-xs opacity-90">
              Ingresa un código de invitación
            </span>
          </Button>
        </div>
        <div className="rounded-lg bg-muted p-4 text-sm">
          <h4 className="font-semibold mb-2">¿Cómo funcionan los equipos?</h4>
          <ul className="space-y-1 text-muted-foreground list-disc list-inside">
            <li>Los puntos de todos los miembros se suman al equipo</li>
            <li>Competís contra otros equipos en el leaderboard de equipos</li>
            <li>Solo podés estar en un equipo a la vez</li>
            <li>El creador del equipo puede gestionar los miembros</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

