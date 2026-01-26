'use client'

import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format, subHours } from 'date-fns'
import { es } from 'date-fns/locale'

// Convierte una fecha ISO UTC a formato datetime-local (YYYY-MM-DDTHH:mm) en hora local
function toLocalDateTimeString(isoString: string): string {
  const date = new Date(isoString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, AlertTriangle, Clock, Lock } from 'lucide-react'
import { createMatchSchema, updateMatchSchema } from '@/lib/validations/match'
import { useAdminTeams } from '@/hooks/use-admin-teams'
import { useAdminPhases } from '@/hooks/use-admin-phases'
import {
  useCreateMatch,
  useUpdateMatch,
  AdminMatch,
} from '@/hooks/use-admin-matches'
import { z } from 'zod'

type CreateFormData = z.infer<typeof createMatchSchema>
type UpdateFormData = z.infer<typeof updateMatchSchema>

interface MatchFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  match?: AdminMatch | null
  onSuccess?: () => void
}

const statusOptions = [
  { value: 'SCHEDULED', label: 'Programado' },
  { value: 'LIVE', label: 'En vivo' },
  { value: 'FINISHED', label: 'Finalizado' },
  { value: 'POSTPONED', label: 'Pospuesto' },
]

export function MatchFormDialog({
  open,
  onOpenChange,
  match,
  onSuccess,
}: MatchFormDialogProps) {
  const isEditing = !!match
  const { data: teamsData, isLoading: teamsLoading } = useAdminTeams()
  const { data: phasesData, isLoading: phasesLoading } = useAdminPhases()
  const createMatch = useCreateMatch()
  const updateMatch = useUpdateMatch()

  const form = useForm<CreateFormData | UpdateFormData>({
    resolver: zodResolver(isEditing ? updateMatchSchema : createMatchSchema),
    defaultValues: {
      homeTeamId: '',
      awayTeamId: '',
      matchDate: '',
      stadium: '',
      city: '',
      country: '',
      phaseId: '',
      groupLetter: null,
    },
  })

  // Resetear form cuando cambia el match
  useEffect(() => {
    if (match) {
      form.reset({
        homeTeamId: match.homeTeam.id,
        awayTeamId: match.awayTeam.id,
        matchDate: toLocalDateTimeString(match.matchDate), // Convert UTC to local time
        stadium: match.stadium,
        city: match.city,
        country: match.country,
        phaseId: match.phase.id,
        groupLetter: match.groupLetter,
        homeScore: match.homeScore,
        awayScore: match.awayScore,
        status: match.status,
      })
    } else {
      form.reset({
        homeTeamId: '',
        awayTeamId: '',
        matchDate: '',
        stadium: '',
        city: '',
        country: '',
        phaseId: '',
        groupLetter: null,
      })
    }
  }, [match, form])

  // Calcular lockTime basado en matchDate
  const watchedMatchDate = form.watch('matchDate')
  const calculatedLockTime = useMemo(() => {
    if (!watchedMatchDate) return null
    try {
      const matchDate = new Date(watchedMatchDate)
      return subHours(matchDate, 1)
    } catch {
      return null
    }
  }, [watchedMatchDate])

  // Filtrar equipos por grupo si la fase es de grupos
  const watchedPhaseId = form.watch('phaseId')
  const selectedPhase = phasesData?.data.find((p) => p.id === watchedPhaseId)
  const isGroupPhase = selectedPhase?.slug === 'grupos'

  const onSubmit = async (data: CreateFormData | UpdateFormData) => {
    try {
      // Convertir matchDate a ISO string para la API
      const submitData = {
        ...data,
        matchDate: data.matchDate
          ? new Date(data.matchDate).toISOString()
          : undefined,
      }

      if (isEditing && match) {
        await updateMatch.mutateAsync({ id: match.id, data: submitData })
      } else {
        await createMatch.mutateAsync(submitData as CreateFormData)
      }

      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      // Error is handled by mutation
      console.error(error)
    }
  }

  const isLoading = createMatch.isPending || updateMatch.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Partido' : 'Nuevo Partido'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Modifica los datos del partido'
              : 'Completa los datos para crear un nuevo partido'}
          </DialogDescription>
        </DialogHeader>

        {isEditing && match && match._count.predictions > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Este partido tiene <strong>{match._count.predictions}</strong>{' '}
              predicciones asociadas. Los cambios pueden afectar los puntos de
              los usuarios.
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Equipos */}
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="homeTeamId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Equipo Local</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={teamsLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar equipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {teamsData?.data.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            <div className="flex items-center gap-2">
                              <img
                                src={team.flagUrl}
                                alt={`Bandera de ${team.name}`}
                                className="h-4 w-6 rounded object-cover"
                                role="img"
                              />
                              {team.name} ({team.code})
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="awayTeamId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Equipo Visitante</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={teamsLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar equipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {teamsData?.data.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            <div className="flex items-center gap-2">
                              <img
                                src={team.flagUrl}
                                alt={`Bandera de ${team.name}`}
                                className="h-4 w-6 rounded object-cover"
                                role="img"
                              />
                              {team.name} ({team.code})
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Fase y Grupo */}
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="phaseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fase</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={phasesLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar fase" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {phasesData?.data.map((phase) => (
                          <SelectItem key={phase.id} value={phase.id}>
                            {phase.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isGroupPhase && (
                <FormField
                  control={form.control}
                  name="groupLetter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grupo</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ''}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar grupo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[
                            'A',
                            'B',
                            'C',
                            'D',
                            'E',
                            'F',
                            'G',
                            'H',
                            'I',
                            'J',
                            'K',
                            'L',
                          ].map((letter) => (
                            <SelectItem key={letter} value={letter}>
                              Grupo {letter}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Fecha y hora */}
            <FormField
              control={form.control}
              name="matchDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha y Hora</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  {calculatedLockTime && (
                    <FormDescription className="flex items-center gap-1">
                      <Lock className="h-3 w-3" />
                      Las predicciones se bloquean:{' '}
                      {format(calculatedLockTime, "dd/MM/yyyy 'a las' HH:mm", {
                        locale: es,
                      })}
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Ubicación */}
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="stadium"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estadio</FormLabel>
                    <FormControl>
                      <Input placeholder="Estadio Azteca" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ciudad</FormLabel>
                    <FormControl>
                      <Input placeholder="Ciudad de México" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>País</FormLabel>
                    <FormControl>
                      <Input placeholder="México" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Solo en edición: Estado y Resultado */}
            {isEditing && (
              <>
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar estado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {statusOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="homeScore"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Goles Local</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            placeholder="0"
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === ''
                                  ? null
                                  : parseInt(e.target.value)
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="awayScore"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Goles Visitante</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            placeholder="0"
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === ''
                                  ? null
                                  : parseInt(e.target.value)
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {form.watch('status') === 'FINISHED' && (
                  <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertDescription>
                      Al guardar con estado &quot;Finalizado&quot; y resultados
                      ingresados, se calcularán automáticamente los puntos de
                      todas las predicciones.
                    </AlertDescription>
                  </Alert>
                )}
              </>
            )}

            {/* Errores de mutación */}
            {(createMatch.error || updateMatch.error) && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {createMatch.error?.message || updateMatch.error?.message}
                </AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Guardar cambios' : 'Crear partido'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
