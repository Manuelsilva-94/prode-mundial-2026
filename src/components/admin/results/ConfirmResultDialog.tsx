'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'
import { AdminMatch } from '@/hooks/use-admin-matches'

interface ConfirmResultDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  match: AdminMatch
  homeScore: number
  awayScore: number
  onConfirm: () => void
}

export function ConfirmResultDialog({
  open,
  onOpenChange,
  match,
  homeScore,
  awayScore,
  onConfirm,
}: ConfirmResultDialogProps) {
  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent aria-describedby="confirm-result-description">
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Resultado Inusual</AlertDialogTitle>
          <AlertDialogDescription id="confirm-result-description">
            Estás a punto de guardar un resultado con un score muy alto. ¿Estás
            seguro de que es correcto?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>
                {match.homeTeam.name} {homeScore} - {awayScore}{' '}
                {match.awayTeam.name}
              </strong>
              <br />
              Este resultado afectará a {match._count.predictions} predicciones
              y recalculará todos los puntos.
            </AlertDescription>
          </Alert>

          <div className="rounded-lg bg-muted p-3 text-sm">
            <p className="font-medium mb-1">¿Confirmás este resultado?</p>
            <p className="text-muted-foreground">
              Una vez guardado, se calcularán los puntos automáticamente para
              todas las predicciones de este partido.
            </p>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Sí, confirmar resultado
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
