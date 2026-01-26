'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, AlertCircle, CheckCircle2, Copy } from 'lucide-react'
import { useUpdateMatchResult } from '@/hooks/use-admin-matches'
import { toast } from 'sonner'
import type { AdminMatch } from '@/hooks/use-admin-matches'

interface BulkResultInputProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  matches: AdminMatch[]
  onSuccess?: () => void
}

interface ParsedResult {
  matchId: string
  match: AdminMatch
  homeScore: number
  awayScore: number
  valid: boolean
  error?: string
}

export function BulkResultInput({
  open,
  onOpenChange,
  matches,
  onSuccess,
}: BulkResultInputProps) {
  const [inputText, setInputText] = useState('')
  const [parsedResults, setParsedResults] = useState<ParsedResult[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const updateResult = useUpdateMatchResult()

  // Filtrar solo partidos sin resultado
  const matchesWithoutResult = matches.filter(
    (m) => m.homeScore === null || m.awayScore === null
  )

  const parseInput = (text: string): ParsedResult[] => {
    const lines = text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)

    const results: ParsedResult[] = []

    for (const line of lines) {
      // Formato esperado: "EQUIPO1 EQUIPO2: SCORE1-SCORE2"
      // Ejemplo: "Argentina Brasil: 2-1"
      const match = line.match(/^(.+?)\s+(.+?):\s*(\d+)-(\d+)$/i)

      if (!match) {
        // Intentar formato alternativo: "SCORE1-SCORE2" (solo números)
        const simpleMatch = line.match(/^(\d+)-(\d+)$/)
        if (simpleMatch) {
          // Si hay solo un partido sin resultado, asignarlo
          if (matchesWithoutResult.length === 1) {
            const homeScore = parseInt(simpleMatch[1], 10)
            const awayScore = parseInt(simpleMatch[2], 10)
            results.push({
              matchId: matchesWithoutResult[0].id,
              match: matchesWithoutResult[0],
              homeScore,
              awayScore,
              valid: homeScore >= 0 && awayScore >= 0,
              error:
                homeScore < 0 || awayScore < 0
                  ? 'Los scores deben ser >= 0'
                  : undefined,
            })
          } else {
            results.push({
              matchId: '',
              match: matchesWithoutResult[0],
              homeScore: 0,
              awayScore: 0,
              valid: false,
              error: 'Hay múltiples partidos. Usá el formato: "EQUIPO1 EQUIPO2: SCORE1-SCORE2"',
            })
          }
        } else {
          results.push({
            matchId: '',
            match: matchesWithoutResult[0],
            homeScore: 0,
            awayScore: 0,
            valid: false,
            error: 'Formato inválido. Usá: "EQUIPO1 EQUIPO2: SCORE1-SCORE2" o "SCORE1-SCORE2"',
          })
        }
        continue
      }

      const [, team1, team2, score1, score2] = match
      const homeScore = parseInt(score1, 10)
      const awayScore = parseInt(score2, 10)

      // Buscar el partido que coincida con los equipos
      const foundMatch = matchesWithoutResult.find((m) => {
        const homeMatch =
          m.homeTeam.name.toLowerCase().includes(team1.toLowerCase()) ||
          m.homeTeam.code.toLowerCase() === team1.toLowerCase() ||
          m.awayTeam.name.toLowerCase().includes(team1.toLowerCase()) ||
          m.awayTeam.code.toLowerCase() === team1.toLowerCase()

        const awayMatch =
          m.awayTeam.name.toLowerCase().includes(team2.toLowerCase()) ||
          m.awayTeam.code.toLowerCase() === team2.toLowerCase() ||
          m.homeTeam.name.toLowerCase().includes(team2.toLowerCase()) ||
          m.homeTeam.code.toLowerCase() === team2.toLowerCase()

        return homeMatch && awayMatch
      })

      if (!foundMatch) {
        results.push({
          matchId: '',
          match: matchesWithoutResult[0],
          homeScore,
          awayScore,
          valid: false,
          error: `No se encontró partido para: ${team1} vs ${team2}`,
        })
        continue
      }

      results.push({
        matchId: foundMatch.id,
        match: foundMatch,
        homeScore,
        awayScore,
        valid: homeScore >= 0 && awayScore >= 0,
        error:
          homeScore < 0 || awayScore < 0
            ? 'Los scores deben ser >= 0'
            : undefined,
      })
    }

    return results
  }

  const handleParse = () => {
    if (!inputText.trim()) {
      toast.error('Ingresá al menos un resultado')
      return
    }

    const parsed = parseInput(inputText)
    setParsedResults(parsed)

    const validCount = parsed.filter((r) => r.valid).length
    if (validCount === 0) {
      toast.error('No se encontraron resultados válidos')
    } else {
      toast.success(`${validCount} resultado(s) válido(s) encontrado(s)`)
    }
  }

  const handleSaveAll = async () => {
    const validResults = parsedResults.filter((r) => r.valid)
    if (validResults.length === 0) {
      toast.error('No hay resultados válidos para guardar')
      return
    }

    setIsProcessing(true)

    try {
      let successCount = 0
      let errorCount = 0

      for (const result of validResults) {
        try {
          await updateResult.mutateAsync({
            id: result.matchId,
            data: {
              homeScore: result.homeScore,
              awayScore: result.awayScore,
            },
          })
          successCount++
        } catch (error) {
          console.error(`Error guardando ${result.match.homeTeam.name} vs ${result.match.awayTeam.name}:`, error)
          errorCount++
        }
      }

      if (successCount > 0) {
        toast.success(
          `${successCount} resultado(s) guardado(s) correctamente${errorCount > 0 ? `, ${errorCount} error(es)` : ''}`
        )
      }

      if (errorCount > 0) {
        toast.error(`${errorCount} resultado(s) fallaron`)
      }

      setInputText('')
      setParsedResults([])
      onSuccess?.()
      onOpenChange(false)
    } catch (error) {
      toast.error('Error al procesar los resultados')
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePasteExample = () => {
    // Generar ejemplo basado en los partidos disponibles
    const example = matchesWithoutResult
      .slice(0, 3)
      .map(
        (m) =>
          `${m.homeTeam.name} ${m.awayTeam.name}: 0-0`
      )
      .join('\n')
    setInputText(example)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Carga Masiva de Resultados</DialogTitle>
          <DialogDescription>
            Ingresá múltiples resultados en formato texto. Un resultado por línea.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Instrucciones */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-medium">Formato:</p>
                <p className="text-sm">
                  <code className="bg-muted px-1 rounded">
                    EQUIPO1 EQUIPO2: SCORE1-SCORE2
                  </code>
                </p>
                <p className="text-sm">
                  Ejemplo: <code className="bg-muted px-1 rounded">Argentina Brasil: 2-1</code>
                </p>
                <p className="text-sm mt-2">
                  O simplemente: <code className="bg-muted px-1 rounded">2-1</code> (si hay un solo partido pendiente)
                </p>
              </div>
            </AlertDescription>
          </Alert>

          {/* Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="bulk-input">Resultados (uno por línea)</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePasteExample}
                className="h-7"
              >
                <Copy className="mr-1 h-3 w-3" />
                Ejemplo
              </Button>
            </div>
            <Textarea
              id="bulk-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Argentina Brasil: 2-1&#10;España Francia: 1-0"
              className="min-h-[120px] font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              {matchesWithoutResult.length} partido(s) sin resultado disponible(s)
            </p>
          </div>

          {/* Botón parsear */}
          <Button onClick={handleParse} className="w-full" variant="outline">
            Validar Resultados
          </Button>

          {/* Resultados parseados */}
          {parsedResults.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Resultados validados:</Label>
                <Badge variant="outline">
                  {parsedResults.filter((r) => r.valid).length} válido(s) /{' '}
                  {parsedResults.length} total
                </Badge>
              </div>
              <div className="max-h-[200px] overflow-y-auto space-y-2 rounded-md border p-3">
                {parsedResults.map((result, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-2 rounded ${
                      result.valid
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-red-50 border border-red-200'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {result.match.homeTeam.name} vs{' '}
                        {result.match.awayTeam.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {result.valid ? (
                          <span className="text-green-700">
                            {result.homeScore} - {result.awayScore}
                          </span>
                        ) : (
                          <span className="text-red-700">{result.error}</span>
                        )}
                      </div>
                    </div>
                    {result.valid ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex gap-2">
            <Button
              onClick={handleSaveAll}
              disabled={
                isProcessing ||
                parsedResults.length === 0 ||
                parsedResults.filter((r) => r.valid).length === 0
              }
              className="flex-1"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                `Guardar ${parsedResults.filter((r) => r.valid).length} resultado(s)`
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setInputText('')
                setParsedResults([])
                onOpenChange(false)
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
