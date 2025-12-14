'use client'

import * as React from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CountdownTimerProps {
  lockTime: string | null
  className?: string
}

export function CountdownTimer({ lockTime, className }: CountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = React.useState<{
    hours: number
    minutes: number
    seconds: number
    isExpired: boolean
  } | null>(null)

  React.useEffect(() => {
    if (!lockTime) {
      setTimeRemaining(null)
      return
    }

    const updateTimer = () => {
      const now = new Date().getTime()
      const lock = new Date(lockTime).getTime()
      const diff = lock - now

      if (diff <= 0) {
        setTimeRemaining({ hours: 0, minutes: 0, seconds: 0, isExpired: true })
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeRemaining({ hours, minutes, seconds, isExpired: false })
    }

    // Actualizar inmediatamente
    updateTimer()

    // Actualizar cada segundo
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [lockTime])

  if (!lockTime || !timeRemaining) {
    return null
  }

  if (timeRemaining.isExpired) {
    return (
      <div
        className={cn(
          'text-destructive flex items-center space-x-1 text-sm font-medium',
          className
        )}
      >
        <AlertCircle className="h-4 w-4" />
        <span>Bloqueado</span>
      </div>
    )
  }

  const { hours, minutes, seconds } = timeRemaining
  const totalMinutes = hours * 60 + minutes
  const totalSeconds = totalMinutes * 60 + seconds

  // Determinar color según tiempo restante
  const isDanger = totalSeconds < 15 * 60 // Menos de 15 minutos
  const isWarning = totalSeconds < 60 * 60 // Menos de 1 hora

  const formatTime = () => {
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    } else {
      return `${seconds}s`
    }
  }

  return (
    <div
      className={cn(
        'flex items-center space-x-1 text-sm font-medium',
        isDanger && 'text-destructive',
        !isDanger && isWarning && 'text-orange-500',
        !isDanger && !isWarning && 'text-muted-foreground',
        className
      )}
    >
      <span>{formatTime()}</span>
      {isDanger && <AlertCircle className="h-4 w-4" />}
    </div>
  )
}
