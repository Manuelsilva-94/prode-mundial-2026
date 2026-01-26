'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { LucideIcon, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuickActionCardProps {
  title: string
  description: string
  href: string
  icon: LucideIcon
  iconBgColor?: string
  iconColor?: string
  badge?: string | number
  badgeVariant?: 'default' | 'warning' | 'danger'
}

export function QuickActionCard({
  title,
  description,
  href,
  icon: Icon,
  iconBgColor = 'bg-primary/10',
  iconColor = 'text-primary',
  badge,
  badgeVariant = 'default',
}: QuickActionCardProps) {
  const badgeColors = {
    default: 'bg-primary text-primary-foreground',
    warning: 'bg-yellow-500 text-white',
    danger: 'bg-red-500 text-white',
  }

  return (
    <Link href={href}>
      <Card className="group transition-all hover:shadow-md hover:border-primary/50">
        <CardContent className="flex items-center p-4">
          <div
            className={cn(
              'flex h-12 w-12 shrink-0 items-center justify-center rounded-lg',
              iconBgColor
            )}
          >
            <Icon className={cn('h-6 w-6', iconColor)} />
          </div>
          <div className="ml-4 flex-1">
            <div className="flex items-center">
              <h3 className="font-semibold">{title}</h3>
              {badge !== undefined && (
                <span
                  className={cn(
                    'ml-2 rounded-full px-2 py-0.5 text-xs font-medium',
                    badgeColors[badgeVariant]
                  )}
                >
                  {badge}
                </span>
              )}
            </div>
            <p className="text-muted-foreground text-sm">{description}</p>
          </div>
          <ChevronRight className="text-muted-foreground h-5 w-5 transition-transform group-hover:translate-x-1" />
        </CardContent>
      </Card>
    </Link>
  )
}

