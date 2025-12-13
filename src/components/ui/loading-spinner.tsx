import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  centered?: boolean
}

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
}

export function LoadingSpinner({
  size = 'md',
  className,
  centered = false,
}: LoadingSpinnerProps) {
  const spinner = (
    <Loader2
      className={cn('animate-spin text-primary', sizeMap[size], className)}
    />
  )

  if (centered) {
    return (
      <div className="flex items-center justify-center p-8">{spinner}</div>
    )
  }

  return spinner
}

