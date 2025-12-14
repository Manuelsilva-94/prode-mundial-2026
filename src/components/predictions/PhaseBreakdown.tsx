'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Trophy, Target, CheckCircle2, TrendingUp } from 'lucide-react'

interface PhaseStats {
  phaseId: string
  phaseName: string
  phaseSlug: string
  totalPredictions: number
  correctPredictions: number
  exactScores: number
  totalPoints: number
  accuracyRate: string
  avgPoints: string
}

interface PhaseBreakdownProps {
  statsByPhase: PhaseStats[]
}

export function PhaseBreakdown({ statsByPhase }: PhaseBreakdownProps) {
  if (statsByPhase.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Estadísticas por Fase</CardTitle>
          <CardDescription>
            Desglose de tu rendimiento en cada fase del torneo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-32 items-center justify-center text-muted-foreground">
            No hay estadísticas por fase disponibles
          </div>
        </CardContent>
      </Card>
    )
  }

  // Ordenar fases (grupos primero, luego eliminatorias)
  const sortedPhases = [...statsByPhase].sort((a, b) => {
    const order: Record<string, number> = {
      grupos: 1,
      dieciseisavos: 2,
      octavos: 3,
      cuartos: 4,
      semifinales: 5,
      'tercer-lugar': 6,
      final: 7,
    }
    return (order[a.phaseSlug] || 99) - (order[b.phaseSlug] || 99)
  })

  const defaultPhase = sortedPhases[0]?.phaseSlug || ''

  return (
    <Card>
      <CardHeader>
        <CardTitle>Estadísticas por Fase</CardTitle>
        <CardDescription>
          Desglose de tu rendimiento en cada fase del torneo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={defaultPhase} className="w-full">
          <TabsList className="mb-4 flex h-auto flex-wrap gap-1">
            {sortedPhases.map((phase) => (
              <TabsTrigger
                key={phase.phaseSlug}
                value={phase.phaseSlug}
                className="text-xs sm:text-sm"
              >
                {phase.phaseName}
              </TabsTrigger>
            ))}
          </TabsList>

          {sortedPhases.map((phase) => (
            <TabsContent key={phase.phaseSlug} value={phase.phaseSlug}>
              <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center space-x-2">
                      <Trophy className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm text-muted-foreground">Puntos</span>
                    </div>
                    <p className="mt-2 text-2xl font-bold">{phase.totalPoints}</p>
                  </div>

                  <div className="rounded-lg border p-4">
                    <div className="flex items-center space-x-2">
                      <Target className="h-4 w-4 text-blue-500" />
                      <span className="text-sm text-muted-foreground">Predicciones</span>
                    </div>
                    <p className="mt-2 text-2xl font-bold">{phase.totalPredictions}</p>
                  </div>

                  <div className="rounded-lg border p-4">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-muted-foreground">Exactos</span>
                    </div>
                    <p className="mt-2 text-2xl font-bold">{phase.exactScores}</p>
                  </div>

                  <div className="rounded-lg border p-4">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-purple-500" />
                      <span className="text-sm text-muted-foreground">Promedio</span>
                    </div>
                    <p className="mt-2 text-2xl font-bold">{phase.avgPoints}</p>
                  </div>
                </div>

                {/* Progress Bars */}
                <div className="space-y-4">
                  {/* Accuracy Rate */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Tasa de acierto</span>
                      <span className="font-medium">{phase.accuracyRate}%</span>
                    </div>
                    <Progress value={parseFloat(phase.accuracyRate)} className="h-2" />
                  </div>

                  {/* Correct Predictions */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Predicciones correctas</span>
                      <span className="font-medium">
                        {phase.correctPredictions} / {phase.totalPredictions}
                      </span>
                    </div>
                    <Progress
                      value={
                        phase.totalPredictions > 0
                          ? (phase.correctPredictions / phase.totalPredictions) * 100
                          : 0
                      }
                      className="h-2"
                    />
                  </div>

                  {/* Exact Scores */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Resultados exactos</span>
                      <span className="font-medium">
                        {phase.exactScores} / {phase.totalPredictions}
                      </span>
                    </div>
                    <Progress
                      value={
                        phase.totalPredictions > 0
                          ? (phase.exactScores / phase.totalPredictions) * 100
                          : 0
                      }
                      className="h-2"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}

