'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle2, AlertCircle, RefreshCw, ClipboardPaste, Trophy } from 'lucide-react'
import { AdminMatch, useUpdateMatchResult, useCalculateMatchPoints } from '@/hooks/use-admin-matches'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ConfirmResultDialog } from './ConfirmResultDialog'
import { LeaderboardPreview } from './LeaderboardPreview'
import { toast } from 'sonner'

interface MatchResultCardProps {
  match: AdminMatch
  onSuccess?: () => void
}

export function MatchResultCard({ match, onSuccess }: MatchResultCardProps) {
  const [homeScore, setHomeScore] = useState<string>(
    match.homeScore?.toString() || ''
  )
  const [awayScore, setAwayScore] = useState<string>(
    match.awayScore?.toString() || ''
  )
  const [showConfirm, setShowConfirm] = useState(false)
  const [showLeaderboardPreview, setShowLeaderboardPreview] = useState(false)
  const [lastWarning, setLastWarning] = useState<string | null>(null)
  const updateResult = useUpdateMatchResult()
  const calculatePoints = useCalculateMatchPoints()

  const handlePasteScore = async () => {
    try {
      const text = await navigator.clipboard.readText()
      // Intentar parsear diferentes formatos: "2-1", "2:1", "2 1", etc.
      const patterns = [
        /^(\d+)[-:](\d+)$/, // "2-1" o "2:1"
        /^(\d+)\s+(\d+)$/, // "2 1"
        /(\d+)[-:](\d+)/, // Cualquier lugar en el texto
      ]

      for (const pattern of patterns) {
        const match = text.match(pattern)
        if (match) {
          const home = parseInt(match[1], 10)
          const away = parseInt(match[2], 10)
          if (!isNaN(home) && !isNaN(away) && home >= 0 && away >= 0) {
            setHomeScore(home.toString())
            setAwayScore(away.toString())
            toast.success(`Score pegado: ${home}-${away}`)
            return
          }
        }
      }

      toast.error('No se pudo detectar un score válido en el portapapeles')
    } catch {
      toast.error('Error al leer el portapapeles')
    }
  }

  const isFinished = match.status === 'FINISHED'
  const hasResult = match.homeScore !== null && match.awayScore !== null
  // Permitir editar si no tiene resultado, incluso si está FINISHED
  const canEdit = !hasResult

  // Validar que los scores sean números enteros >= 0
  const homeScoreNum = parseInt(homeScore, 10)
  const awayScoreNum = parseInt(awayScore, 10)
  const isValidHome = homeScore === '' || (!isNaN(homeScoreNum) && homeScoreNum >= 0)
  const isValidAway = awayScore === '' || (!isNaN(awayScoreNum) && awayScoreNum >= 0)
  const bothScoresFilled = homeScore !== '' && awayScore !== ''
  const canSave = isValidHome && isValidAway && bothScoresFilled && !updateResult.isPending && canEdit

  // Detectar scores inusuales (>= 10 en cualquier lado)
  const isUnusualScore = (homeScoreNum >= 10 || awayScoreNum >= 10) && bothScoresFilled

  const handleSave = () => {
    if (!canSave) return

    // Si es un score inusual, mostrar confirmación
    if (isUnusualScore) {
      setShowConfirm(true)
      return
    }

    // Guardar directamente
    saveResult()
  }

  const saveResult = async () => {
    try {
      const result = await updateResult.mutateAsync({
        id: match.id,
        data: {
          homeScore: parseInt(homeScore, 10),
          awayScore: parseInt(awayScore, 10),
        },
      })

      // Mostrar mensaje de éxito con información de puntos
      if (result.data.pointsCalculation) {
        const { predictionsProcessed, totalPointsAwarded } = result.data.pointsCalculation
        toast.success(
          `Resultado guardado: ${totalPointsAwarded} puntos calculados para ${predictionsProcessed} predicciones`,
          {
            description: `${match.homeTeam.name} ${homeScore} - ${awayScore} ${match.awayTeam.name}`,
          }
        )
      } else if (result.warning) {
        setLastWarning(result.warning)
        toast.warning(result.warning, {
          description: result.message,
        })
      } else {
        setLastWarning(null)
        toast.success('Resultado guardado correctamente')
      }

      setShowConfirm(false)
      onSuccess?.()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al guardar resultado'
      )
    }
  }

  const handleRecalculate = async () => {
    try {
      const result = await calculatePoints.mutateAsync(match.id)
      const { predictionsProcessed, totalPointsAwarded } = result.data
      toast.success(
        `Puntos recalculados: ${totalPointsAwarded} puntos para ${predictionsProcessed} predicciones`
      )
      setLastWarning(null)
      onSuccess?.()
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Error al recalcular puntos'
      )
    }
  }

  return (
    <>
      <Card className={`transition-all ${hasResult ? 'bg-muted/50' : ''}`}>
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-4">
            {/* Header con fecha y fase */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {format(new Date(match.matchDate), 'dd/MM/yyyy HH:mm', {
                    locale: es,
                  })}
                </span>
                <Badge variant="outline">{match.phase.name}</Badge>
                {hasResult && (
                  <Badge variant="default" className="bg-green-500">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Finalizado
                  </Badge>
                )}
                {isFinished && !hasResult && (
                  <Badge variant="outline" className="border-yellow-500 text-yellow-700">
                    <AlertCircle className="mr-1 h-3 w-3" />
                    Sin resultado
                  </Badge>
                )}
                {match.status === 'LIVE' && (
                  <Badge variant="destructive">
                    <AlertCircle className="mr-1 h-3 w-3" />
                    En vivo
                  </Badge>
                )}
              </div>
              {match._count.predictions > 0 && (
                <span className="text-xs text-muted-foreground">
                  {match._count.predictions} predicciones
                </span>
              )}
            </div>

            {/* Equipos y scores */}
            <div className="flex flex-col sm:grid sm:grid-cols-12 gap-4 items-center">
              {/* Equipo local */}
              <div className="w-full sm:col-span-5 flex items-center gap-3">
                <img
                  src={match.homeTeam.flagUrl}
                  alt={match.homeTeam.name}
                  className="h-8 w-12 rounded object-cover flex-shrink-0"
                />
                <span className="font-medium text-sm sm:text-base truncate">{match.homeTeam.name}</span>
              </div>

              {/* Inputs de scores */}
              <div className="w-full sm:col-span-2 flex items-center gap-2 justify-center">
                <Input
                  type="number"
                  min="0"
                  value={homeScore}
                  onChange={(e) => setHomeScore(e.target.value)}
                  disabled={hasResult || updateResult.isPending}
                  className="text-center text-lg sm:text-xl font-bold h-12 sm:h-14 text-base"
                  placeholder="0"
                  aria-label={`Goles de ${match.homeTeam.name}`}
                  aria-describedby={!isValidHome && homeScore !== '' ? 'home-score-error' : undefined}
                />
                <span className="text-lg sm:text-xl font-bold" aria-label="separador">-</span>
                <Input
                  type="number"
                  min="0"
                  value={awayScore}
                  onChange={(e) => setAwayScore(e.target.value)}
                  disabled={hasResult || updateResult.isPending}
                  className="text-center text-lg sm:text-xl font-bold h-12 sm:h-14 text-base"
                  placeholder="0"
                  aria-label={`Goles de ${match.awayTeam.name}`}
                  aria-describedby={!isValidAway && awayScore !== '' ? 'away-score-error' : undefined}
                />
                {!hasResult && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handlePasteScore}
                    disabled={updateResult.isPending}
                    className="h-12 w-12 sm:h-14 sm:w-14"
                    aria-label="Pegar score del portapapeles"
                    title="Pegar score del portapapeles"
                  >
                    <ClipboardPaste className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                  </Button>
                )}
              </div>

              {/* Equipo visitante */}
              <div className="w-full sm:col-span-5 flex items-center gap-3 justify-end sm:justify-end">
                <span className="font-medium text-sm sm:text-base truncate">{match.awayTeam.name}</span>
                <img
                  src={match.awayTeam.flagUrl}
                  alt={`Bandera de ${match.awayTeam.name}`}
                  className="h-8 w-12 rounded object-cover flex-shrink-0"
                  role="img"
                />
              </div>
            </div>

            {/* Validaciones y botones */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                {!isValidHome && homeScore !== '' && (
                  <p id="home-score-error" className="text-xs text-destructive" role="alert">
                    El score local debe ser un número mayor o igual a 0
                  </p>
                )}
                {!isValidAway && awayScore !== '' && (
                  <p id="away-score-error" className="text-xs text-destructive" role="alert">
                    El score visitante debe ser un número mayor o igual a 0
                  </p>
                )}
                {isUnusualScore && (
                  <p className="text-xs text-yellow-600">
                    ⚠️ Score inusual detectado. Se pedirá confirmación.
                  </p>
                )}
                {lastWarning && hasResult && (
                  <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-2 mt-2">
                    <p className="text-xs text-yellow-800 font-medium">
                      ⚠️ {lastWarning}
                    </p>
                    <p className="text-xs text-yellow-700 mt-1">
                      El resultado se guardó pero el cálculo de puntos falló. Podés recalcular manualmente.
                    </p>
                  </div>
                )}
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                {lastWarning && hasResult && (
                  <Button
                    onClick={handleRecalculate}
                    disabled={calculatePoints.isPending}
                    size="sm"
                    variant="outline"
                    className="w-full sm:min-w-[160px] h-11"
                  >
                    {calculatePoints.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Recalculando...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Recalcular Puntos
                      </>
                    )}
                  </Button>
                )}
                <Button
                  onClick={() => setShowLeaderboardPreview(true)}
                  size="sm"
                  variant="ghost"
                  className="w-full sm:min-w-[120px] h-11"
                >
                  <Trophy className="mr-2 h-4 w-4" />
                  Ver Ranking
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!canSave || hasResult}
                  size="sm"
                  className="w-full sm:min-w-[140px] h-11"
                >
                  {updateResult.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : hasResult ? (
                    'Actualizar'
                  ) : (
                    'Guardar Resultado'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de confirmación para scores inusuales */}
      <ConfirmResultDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        match={match}
        homeScore={parseInt(homeScore, 10)}
        awayScore={parseInt(awayScore, 10)}
        onConfirm={saveResult}
      />

      {/* Dialog de preview del leaderboard */}
      <LeaderboardPreview
        open={showLeaderboardPreview}
        onOpenChange={setShowLeaderboardPreview}
      />
    </>
  )
}