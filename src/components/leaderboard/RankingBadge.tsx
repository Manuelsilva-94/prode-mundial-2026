'use client'

import { Trophy, Medal, Award } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RankingBadgeProps {
  ranking: number
  className?: string
}

export function RankingBadge({ ranking, className }: RankingBadgeProps) {
  if (ranking === 1) {
    return (
      <div
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-full bg-yellow-500 text-white',
          className
        )}
      >
        <Trophy className="h-5 w-5" />
      </div>
    )
  }

  if (ranking === 2) {
    return (
      <div
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-full bg-gray-400 text-white',
          className
        )}
      >
        <Medal className="h-5 w-5" />
      </div>
    )
  }

  if (ranking === 3) {
    return (
      <div
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-full bg-amber-600 text-white',
          className
        )}
      >
        <Award className="h-5 w-5" />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground font-semibold text-sm',
        className
      )}
    >
      {ranking}
    </div>
  )
}

