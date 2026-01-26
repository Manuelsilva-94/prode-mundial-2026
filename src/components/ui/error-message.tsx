import { AlertCircle, RefreshCw, WifiOff, ServerOff } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ErrorMessageProps {
  title?: string
  message: string
  onRetry?: () => void
  className?: string
  type?: 'error' | 'network' | 'server'
  suggestion?: string
}

const errorConfig = {
  error: {
    icon: AlertCircle,
    defaultTitle: 'Algo salió mal',
    defaultSuggestion: 'Por favor, intenta nuevamente en unos momentos.',
  },
  network: {
    icon: WifiOff,
    defaultTitle: 'Problema de conexión',
    defaultSuggestion: 'Verifica tu conexión a internet e intenta nuevamente.',
  },
  server: {
    icon: ServerOff,
    defaultTitle: 'Error del servidor',
    defaultSuggestion: 'El servidor está experimentando problemas. Por favor, intenta más tarde.',
  },
}

export function ErrorMessage({
  title,
  message,
  onRetry,
  className,
  type = 'error',
  suggestion,
}: ErrorMessageProps) {
  const config = errorConfig[type]
  const Icon = config.icon
  const finalTitle = title || config.defaultTitle
  const finalSuggestion = suggestion || config.defaultSuggestion

  return (
    <Alert variant="destructive" className={cn('', className)}>
      <Icon className="h-4 w-4" />
      <AlertTitle className="text-base sm:text-lg">{finalTitle}</AlertTitle>
      <AlertDescription className="mt-2 space-y-3">
        <p className="text-sm sm:text-base">{message}</p>
        {finalSuggestion && (
          <p className="text-xs sm:text-sm text-muted-foreground">
            💡 {finalSuggestion}
          </p>
        )}
        {onRetry && (
          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="min-h-[44px] sm:min-h-0 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Reintentar
            </Button>
          </div>
        )}
      </AlertDescription>
    </Alert>
  )
}

