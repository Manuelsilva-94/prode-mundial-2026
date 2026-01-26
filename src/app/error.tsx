'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Home, RefreshCw, AlertTriangle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to error reporting service
    console.error('Application error:', error)
  }, [error])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="flex w-full max-w-md flex-col items-center space-y-6">
        {/* Icono */}
        <div className="text-destructive">
          <AlertTriangle className="h-16 w-16" strokeWidth={1.5} />
        </div>

        {/* Contenido */}
        <div className="space-y-2 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Algo salió mal
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg">
            Ocurrió un error inesperado. Nuestro equipo ha sido notificado.
          </p>
        </div>

        {/* Alert con información */}
        <Alert variant="destructive" className="w-full">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="text-base">Error de aplicación</AlertTitle>
          <AlertDescription className="mt-2 text-sm">
            {error.message || 'Un error desconocido ocurrió. Por favor, intenta nuevamente.'}
          </AlertDescription>
        </Alert>

        {/* Sugerencias */}
        <div className="w-full space-y-3 rounded-lg bg-muted/50 p-4 text-left">
          <p className="text-sm font-medium">Intenta lo siguiente:</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="mt-0.5">1.</span>
              <span>Recarga la página</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5">2.</span>
              <span>Vuelve a la página anterior</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5">3.</span>
              <span>Si el problema persiste, contacta a soporte</span>
            </li>
          </ul>
        </div>

        {/* Acciones */}
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            onClick={reset}
            variant="default"
            className="min-h-[44px] w-full sm:w-auto"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Intentar Nuevamente
          </Button>
          <Button
            asChild
            variant="outline"
            className="min-h-[44px] w-full sm:w-auto"
          >
            <Link href="/home">
              <Home className="mr-2 h-4 w-4" />
              Ir al Inicio
            </Link>
          </Button>
        </div>

        {/* Error ID para debugging (solo en desarrollo) */}
        {process.env.NODE_ENV === 'development' && error.digest && (
          <div className="mt-4 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
            Error ID: {error.digest}
          </div>
        )}
      </div>
    </main>
  )
}
