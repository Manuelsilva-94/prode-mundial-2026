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
import { Textarea } from '@/components/ui/textarea'
import { useCreateTeam } from '@/hooks/use-create-team'
import { CheckCircle2, Copy, Loader2 } from 'lucide-react'
import { createTeamSchema } from '@/lib/validations/team'

const formSchema = createTeamSchema

type FormValues = z.infer<typeof formSchema>

interface CreateTeamDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CreateTeamDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateTeamDialogProps) {
  const createTeam = useCreateTeam()
  const [createdInviteCode, setCreatedInviteCode] = React.useState<
    string | null
  >(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  })

  const handleSubmit = async (data: FormValues) => {
    try {
      const result = await createTeam.mutateAsync(data)
      setCreatedInviteCode(result.data.inviteCode)
    } catch (error) {
      // Error is handled by the hook
      console.error('Error creating team:', error)
    }
  }

  const handleCopyCode = async () => {
    if (createdInviteCode) {
      await navigator.clipboard.writeText(createdInviteCode)
    }
  }

  const handleClose = (isOpen: boolean) => {
    // Prevenir que se cierre mientras está procesando
    if (!isOpen && createTeam.isPending) {
      return
    }

    if (!isOpen) {
      const wasSuccess = !!createdInviteCode
      form.reset()
      setCreatedInviteCode(null)
      onOpenChange(isOpen)
      // Si estamos cerrando después de crear el equipo exitosamente, invalidar query
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

  if (createdInviteCode) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <DialogTitle className="text-center">
              ¡Equipo creado exitosamente!
            </DialogTitle>
            <DialogDescription className="text-center">
              Tu equipo ha sido creado. Comparte este código para que otros
              puedan unirse.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Código de invitación</Label>
              <div className="flex items-center space-x-2">
                <Input
                  value={createdInviteCode}
                  readOnly
                  className="font-mono text-lg font-bold"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleCopyCode}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
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
          <DialogTitle>Crear Equipo</DialogTitle>
          <DialogDescription>
            Crea un nuevo equipo para competir con tus amigos
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Nombre del equipo <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              {...form.register('name')}
              placeholder="Ej: Los Campeones"
              disabled={createTeam.isPending}
            />
            {form.formState.errors.name && (
              <p className="text-destructive text-sm">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción (opcional)</Label>
            <Textarea
              id="description"
              {...form.register('description')}
              placeholder="Describe tu equipo..."
              rows={3}
              disabled={createTeam.isPending}
            />
            {form.formState.errors.description && (
              <p className="text-destructive text-sm">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>

          {createTeam.error && (
            <div className="rounded-lg bg-destructive/10 p-3 text-destructive text-sm">
              {createTeam.error.message}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
              disabled={createTeam.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={createTeam.isPending}>
              {createTeam.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                'Crear Equipo'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

