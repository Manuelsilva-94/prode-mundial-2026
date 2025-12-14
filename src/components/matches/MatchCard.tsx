'use client'

import { memo, useCallback, useMemo, useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { CountdownTimer } from './CountdownTimer'
import { useCreatePrediction } from '@/hooks/use-create-prediction'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { formatInTimeZone } from 'date-fns-tz'
import Image from 'next/image'
import { Trophy, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MatchCardProps {
  match: {
    id: string
    homeTeam: {
      id: string
      name: string
      code: string
      flagUrl: string
    }
    awayTeam: {
      id: string
      name: string
      code: string
      flagUrl: string
    }
    matchDate: string
    phase: {
      id: string
      name: string
      slug: string
      pointsMultiplier: number
    }
    groupLetter?: string
    homeScore: number | null
    awayScore: number | null
    status: 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'POSTPONED'
    lockTime: string | null
    isLocked: boolean
    userPrediction: {
      id: string
      predictedHomeScore: number
      predictedAwayScore: number
      pointsEarned: number
      createdAt: string
      updatedAt: string
    } | null
  }
}

/**
 * MatchCard - Componente memoizado para evitar re-renders innecesarios
 * Solo se re-renderiza si cambian las props del match
 */
export const MatchCard = memo(function MatchCard({ match }: MatchCardProps) {
  const createPrediction = useCreatePrediction()
  const [homeScore, setHomeScore] = useState<string>('')
  const [awayScore, setAwayScore] = useState<string>('')

  // Inicializar valores desde predicción existente
  useEffect(() => {
    if (match.userPrediction) {
      setHomeScore(match.userPrediction.predictedHomeScore.toString())
      setAwayScore(match.userPrediction.predictedAwayScore.toString())
    } else {
      setHomeScore('')
      setAwayScore('')
    }
  }, [match.userPrediction])

  const isLocked = match.isLocked
  const isFinished = match.status === 'FINISHED'
  const hasPrediction = !!match.userPrediction
  const userTz = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, [])

  // Formatear fecha en timezone local - memoizado
  const matchDateLocal = useMemo(() => {
    try {
      return formatInTimeZone(new Date(match.matchDate), userTz, 'PPPp', {
        locale: es,
      })
    } catch {
      return format(new Date(match.matchDate), "PPP 'a las' p", { locale: es })
    }
  }, [match.matchDate, userTz])

  // Callback memoizado para guardar predicción
  const handleSave = useCallback(async () => {
    const home = parseInt(homeScore)
    const away = parseInt(awayScore)

    if (isNaN(home) || isNaN(away) || home < 0 || away < 0) {
      return
    }

    try {
      await createPrediction.mutateAsync({
        matchId: match.id,
        predictedHomeScore: home,
        predictedAwayScore: away,
      })
    } catch (error) {
      console.error('Error saving prediction:', error)
    }
  }, [homeScore, awayScore, match.id, createPrediction])

  const canEdit = !isLocked && !isFinished

  return (
    <Card className={cn(isLocked && 'opacity-75')}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Badge variant="outline">{match.phase.name}</Badge>
          {match.lockTime && !isFinished && (
            <CountdownTimer lockTime={match.lockTime} />
          )}
        </div>
        <div className="text-muted-foreground text-sm">{matchDateLocal}</div>
        {match.groupLetter && (
          <div className="text-muted-foreground text-xs">
            Grupo {match.groupLetter}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Equipos */}
        <div className="flex items-center justify-between">
          <div className="flex flex-1 items-center space-x-3">
            <div className="relative h-10 w-14">
              <Image
                src={match.homeTeam.flagUrl}
                alt={match.homeTeam.name}
                fill
                className="object-contain"
              />
            </div>
            <span className="font-medium">{match.homeTeam.name}</span>
          </div>

          {/* Score actual (si está finalizado) */}
          {isFinished &&
            match.homeScore !== null &&
            match.awayScore !== null && (
              <div className="mx-4 flex items-center space-x-2">
                <span className="text-2xl font-bold">
                  {match.homeScore} - {match.awayScore}
                </span>
              </div>
            )}

          <div className="flex flex-1 items-center justify-end space-x-3">
            <span className="font-medium">{match.awayTeam.name}</span>
            <div className="relative h-10 w-14">
              <Image
                src={match.awayTeam.flagUrl}
                alt={match.awayTeam.name}
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>

        {/* Inputs de predicción */}
        {!isFinished && (
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center space-x-2">
              <Input
                type="number"
                min="0"
                max="20"
                value={homeScore}
                onChange={(e) => setHomeScore(e.target.value)}
                disabled={!canEdit || createPrediction.isPending}
                className="w-16 text-center"
                placeholder="0"
              />
              <span className="text-muted-foreground">-</span>
              <Input
                type="number"
                min="0"
                max="20"
                value={awayScore}
                onChange={(e) => setAwayScore(e.target.value)}
                disabled={!canEdit || createPrediction.isPending}
                className="w-16 text-center"
                placeholder="0"
              />
            </div>
          </div>
        )}

        {/* Predicción guardada o resultado */}
        {hasPrediction && match.userPrediction && (
          <div className="flex items-center justify-center space-x-2 text-sm">
            <span className="text-muted-foreground">Tu predicción:</span>
            <span className="font-medium">
              {match.userPrediction.predictedHomeScore} -{' '}
              {match.userPrediction.predictedAwayScore}
            </span>
            {isFinished && match.userPrediction.pointsEarned > 0 && (
              <span className="font-bold text-green-600">
                +{match.userPrediction.pointsEarned} puntos
              </span>
            )}
          </div>
        )}

        {/* Botón guardar */}
        {canEdit && (
          <Button
            onClick={handleSave}
            disabled={
              createPrediction.isPending ||
              !homeScore ||
              !awayScore ||
              parseInt(homeScore) < 0 ||
              parseInt(awayScore) < 0 ||
              (hasPrediction &&
                match.userPrediction !== null &&
                parseInt(homeScore) ===
                  match.userPrediction.predictedHomeScore &&
                parseInt(awayScore) === match.userPrediction.predictedAwayScore)
            }
            className="w-full"
            variant={hasPrediction ? 'outline' : 'default'}
          >
            {createPrediction.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : hasPrediction ? (
              'Actualizar predicción'
            ) : (
              'Guardar predicción'
            )}
          </Button>
        )}

        {/* Estado bloqueado */}
        {isLocked && !isFinished && (
          <div className="text-muted-foreground text-center text-sm">
            Las predicciones para este partido están bloqueadas
          </div>
        )}

        {/* Indicador de resultado exacto */}
        {isFinished &&
          hasPrediction &&
          match.userPrediction &&
          match.userPrediction.pointsEarned > 0 &&
          match.homeScore !== null &&
          match.awayScore !== null &&
          match.userPrediction.predictedHomeScore === match.homeScore &&
          match.userPrediction.predictedAwayScore === match.awayScore && (
            <div className="flex items-center justify-center space-x-1 text-yellow-600">
              <Trophy className="h-4 w-4" />
              <span className="text-sm font-medium">¡Resultado exacto!</span>
            </div>
          )}
      </CardContent>
    </Card>
  )
})

// Display name para debugging
MatchCard.displayName = 'MatchCard'
