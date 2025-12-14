'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useJoinTeam } from '@/hooks/use-join-team'
import { useTeamByCode } from '@/hooks/use-team-by-code'
import { UserAvatar } from '@/components/leaderboard/UserAvatar'
import { CheckCircle2, Loader2, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const formSchema = z.object({
  code: z
    .string()
    .length(6, 'El código debe tener exactamente 6 caracteres')
    .regex(
      /^[A-Z0-9]+$/,
      'El código solo puede contener letras mayúsculas y números'
    )
    .transform((val) => val.toUpperCase()),
})

type FormValues = z.infer<typeof formSchema>

interface JoinTeamDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function JoinTeamDialog({
  open,
  onOpenChange,
  onSuccess,
}: JoinTeamDialogProps) {
  const joinTeam = useJoinTeam()
  const [joinSuccess, setJoinSuccess] = React.useState(false)
  const [code, setCode] = React.useState('')

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: '',
    },
  })

  // Preview del equipo cuando se ingresa un código válido
  const teamPreview = useTeamByCode(
    form.watch('code'),
    form.formState.isValid && form.watch('code').length === 6
  )

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
    setCode(value)
    form.setValue('code', value, { shouldValidate: true })
  }

  const handleSubmit = async (_data: FormValues) => {
    if (!teamPreview.data) return

    try {
      await joinTeam.mutateAsync({ teamId: teamPreview.data.id })
      setJoinSuccess(true)
    } catch (error) {
      // Error is handled by the hook
      console.error('Error joining team:', error)
    }
  }

  const handleClose = (isOpen: boolean) => {
    // Prevenir que se cierre mientras está procesando
    if (!isOpen && joinTeam.isPending) {
      return
    }

    if (!isOpen) {
      const wasSuccess = joinSuccess
      form.reset()
      setCode('')
      setJoinSuccess(false)
      onOpenChange(isOpen)
      // Si estamos cerrando después de unirse exitosamente, invalidar query
      if (wasSuccess) {
        // Usar setTimeout para asegurar que el modal se cierre primero
        setTimeout(() => {
          onSuccess?.()
        }, 0)
      }
    } else {
      onOpenChange(isOpen)
    }
  }

  if (joinSuccess) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <DialogTitle className="text-center">
              ¡Te uniste al equipo exitosamente!
            </DialogTitle>
            <DialogDescription className="text-center">
              Ya eres miembro del equipo. ¡Empieza a competir!
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => handleClose(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Unirse a un Equipo</DialogTitle>
          <DialogDescription>
            Ingresa el código de invitación de 6 caracteres
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Código de invitación</Label>
            <Input
              id="code"
              value={code}
              onChange={handleCodeChange}
              placeholder="ABC123"
              maxLength={6}
              className="font-mono text-lg font-bold text-center"
              disabled={joinTeam.isPending}
              autoFocus
            />
            {form.formState.errors.code && (
              <p className="text-destructive text-sm">
                {form.formState.errors.code.message}
              </p>
            )}
          </div>

          {/* Preview del equipo */}
          {teamPreview.isLoading && code.length === 6 && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {teamPreview.data && (
            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-semibold">{teamPreview.data.name}</h3>
                  </div>
                  {teamPreview.data.description && (
                    <p className="text-muted-foreground text-sm">
                      {teamPreview.data.description}
                    </p>
                  )}
                  <div className="flex items-center space-x-2 text-muted-foreground text-sm">
                    <UserAvatar
                      name={teamPreview.data.creator.name}
                      avatarUrl={teamPreview.data.creator.avatarUrl}
                      className="h-6 w-6"
                    />
                    <span>Creado por {teamPreview.data.creator.name}</span>
                  </div>
                  <div className="text-muted-foreground text-sm">
                    {teamPreview.data.memberCount} miembro
                    {teamPreview.data.memberCount !== 1 ? 's' : ''}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {teamPreview.error && code.length === 6 && (
            <div className="rounded-lg bg-destructive/10 p-3 text-destructive text-sm">
              {teamPreview.error.message}
            </div>
          )}

          {joinTeam.error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-destructive text-sm">
              {joinTeam.error.message}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
              disabled={joinTeam.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={joinTeam.isPending || !teamPreview.data}
            >
              {joinTeam.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uniéndose...
                </>
              ) : (
                'Unirse al Equipo'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

