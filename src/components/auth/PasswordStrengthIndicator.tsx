'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong'

interface PasswordStrengthIndicatorProps {
  password: string
  className?: string
}

export function PasswordStrengthIndicator({
  password,
  className,
}: PasswordStrengthIndicatorProps) {
  const strength = React.useMemo(() => calculatePasswordStrength(password), [password])

  if (!password) return null

  const strengthConfig = {
    weak: { label: 'Débil', color: 'bg-red-500', width: 'w-1/4' },
    fair: { label: 'Regular', color: 'bg-orange-500', width: 'w-2/4' },
    good: { label: 'Buena', color: 'bg-yellow-500', width: 'w-3/4' },
    strong: { label: 'Fuerte', color: 'bg-green-500', width: 'w-full' },
  }

  const config = strengthConfig[strength]

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full transition-all duration-300', config.color, config.width)}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Fortaleza: <span className="font-medium">{config.label}</span>
      </p>
    </div>
  )
}

function calculatePasswordStrength(password: string): PasswordStrength {
  if (password.length === 0) return 'weak'

  let score = 0

  // Longitud
  if (password.length >= 8) score += 1
  if (password.length >= 12) score += 1

  // Complejidad
  if (/[a-z]/.test(password)) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/[0-9]/.test(password)) score += 1
  if (/[^a-zA-Z0-9]/.test(password)) score += 1

  if (score <= 2) return 'weak'
  if (score <= 4) return 'fair'
  if (score <= 5) return 'good'
  return 'strong'
}

