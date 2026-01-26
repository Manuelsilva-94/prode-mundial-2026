'use client'

import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Loader2, AlertTriangle, Trash2 } from 'lucide-react'
import { useDeleteMatch, AdminMatch } from '@/hooks/use-admin-matches'

interface DeleteMatchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  match: AdminMatch | null
  onSuccess?: () => void
}

export function DeleteMatchDialog({
  open,
  onOpenChange,
  match,
  onSuccess,
}: DeleteMatchDialogProps) {
  const [forceDelete, setForceDelete] = useState(false)
  const deleteMatch = useDeleteMatch()

  const hasPredictions = match && match._count.predictions > 0

  const handleDelete = async () => {
    if (!match || deleteMatch.isPending) return

    try {
      await deleteMatch.mutateAsync({
        id: match.id,
        force: hasPredictions ? forceDelete : false,
      })
      // Cerrar el modal y resetear estado solo después de que la mutación se complete
      setForceDelete(false)
      onOpenChange(false)
      // Llamar onSuccess después de cerrar el modal para que haga el refetch
      onSuccess?.()
    } catch (error) {
      // Si requiere force delete, mostrar el checkbox
      const err = error as Error & { requiresForce?: boolean }
      if (err.requiresForce) {
        // El error ya se muestra en la UI
      }
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    // Prevenir que se cierre el modal mientras se está procesando la eliminación
    if (!newOpen && deleteMatch.isPending) {
      return
    }
    if (!newOpen) {
      setForceDelete(false)
      deleteMatch.reset()
    }
    onOpenChange(newOpen)
  }

  if (!match) return null

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent aria-describedby="delete-match-description">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" aria-hidden="true" />
            Eliminar Partido
          </AlertDialogTitle>
          <AlertDialogDescription id="delete-match-description">
            ¿Estás seguro de que querés eliminar el partido{' '}
            <strong>
              {match.homeTeam.name} vs {match.awayTeam.name}
            </strong>
            ?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          {hasPredictions && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Este partido tiene{' '}
                <strong>{match._count.predictions} predicciones</strong>{' '}
                asociadas. Eliminar el partido también eliminará todas las
                predicciones y los puntos asociados.
              </AlertDescription>
            </Alert>
          )}

          {hasPredictions && (
            <div className="flex items-center space-x-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3">
              <Checkbox
                id="force-delete"
                checked={forceDelete}
                onCheckedChange={(checked) => setForceDelete(checked === true)}
              />
              <Label
                htmlFor="force-delete"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Confirmo que quiero eliminar el partido y todas sus predicciones
              </Label>
            </div>
          )}

          {deleteMatch.error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{deleteMatch.error.message}</AlertDescription>
            </Alert>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMatch.isPending}>
            Cancelar
          </AlertDialogCancel>
          {/* Usamos Button en lugar de AlertDialogAction para evitar el cierre automático */}
          <Button
            onClick={handleDelete}
            disabled={
              deleteMatch.isPending || (hasPredictions ? !forceDelete : false)
            }
            variant="destructive"
          >
            {deleteMatch.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Eliminar
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

