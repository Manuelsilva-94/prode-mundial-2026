'use client'

import { Suspense, ReactNode } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

interface SuspenseBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  variant?: 'card' | 'table' | 'chart' | 'profile' | 'custom'
}

// Fallbacks predefinidos
const CardFallback = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-48" />
    </CardHeader>
    <CardContent className="space-y-3">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </CardContent>
  </Card>
)

const TableFallback = () => (
  <div className="space-y-2">
    <Skeleton className="h-10 w-full" />
    {Array.from({ length: 5 }).map((_, i) => (
      <Skeleton key={i} className="h-12 w-full" />
    ))}
  </div>
)

const ChartFallback = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-4 w-64" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-[300px] w-full" />
    </CardContent>
  </Card>
)

const ProfileFallback = () => (
  <div className="space-y-4">
    <div className="flex items-center space-x-4">
      <Skeleton className="h-16 w-16 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-48" />
      </div>
    </div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="pt-6">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="mt-2 h-4 w-24" />
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
)

const getFallback = (variant: SuspenseBoundaryProps['variant']) => {
  switch (variant) {
    case 'card':
      return <CardFallback />
    case 'table':
      return <TableFallback />
    case 'chart':
      return <ChartFallback />
    case 'profile':
      return <ProfileFallback />
    default:
      return <CardFallback />
  }
}

/**
 * SuspenseBoundary - Wrapper reutilizable para Suspense con fallbacks predefinidos
 * 
 * @example
 * <SuspenseBoundary variant="chart">
 *   <LazyChart data={data} />
 * </SuspenseBoundary>
 */
export function SuspenseBoundary({
  children,
  fallback,
  variant = 'card',
}: SuspenseBoundaryProps) {
  return (
    <Suspense fallback={fallback || getFallback(variant)}>
      {children}
    </Suspense>
  )
}

