import { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick?: () => void
    href?: string
  }
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  size = 'md',
}: EmptyStateProps) {
  const iconSizes = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  }

  const paddingSizes = {
    sm: 'py-8',
    md: 'py-12',
    lg: 'py-16',
  }

  const ActionButton = action?.href ? (
    <Button asChild variant="default" className="min-h-[44px]">
      <Link href={action.href}>{action.label}</Link>
    </Button>
  ) : action?.onClick ? (
    <Button onClick={action.onClick} variant="default" className="min-h-[44px]">
      {action.label}
    </Button>
  ) : null

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center px-4 text-center',
        paddingSizes[size],
        className
      )}
    >
      {Icon && (
        <div className={cn('text-muted-foreground mb-4', iconSizes[size])}>
          <Icon className={cn('h-full w-full')} strokeWidth={1.5} />
        </div>
      )}
      <h3 className="mb-2 text-lg sm:text-xl font-semibold">{title}</h3>
      {description && (
        <p className="text-muted-foreground mb-6 max-w-md text-sm sm:text-base">
          {description}
        </p>
      )}
      {ActionButton}
    </div>
  )
}

