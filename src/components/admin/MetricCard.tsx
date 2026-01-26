'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  title: string
  value: string | number
  description?: string
  icon: LucideIcon
  iconColor?: string
  trend?: {
    value: number
    label: string
  }
}

export function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  iconColor = 'text-primary',
  trend,
}: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={cn('h-5 w-5', iconColor)} />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value.toLocaleString()}</div>
        {description && (
          <p className="text-muted-foreground text-xs">{description}</p>
        )}
        {trend && (
          <div className="mt-2 flex items-center text-xs">
            {trend.value >= 0 ? (
              <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
            ) : (
              <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
            )}
            <span
              className={cn(
                trend.value >= 0 ? 'text-green-500' : 'text-red-500'
              )}
            >
              {trend.value >= 0 ? '+' : ''}
              {trend.value}%
            </span>
            <span className="text-muted-foreground ml-1">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

