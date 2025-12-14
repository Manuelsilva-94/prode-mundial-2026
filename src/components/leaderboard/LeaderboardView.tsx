'use client'

import { LeaderboardTable } from './LeaderboardTable'
import { LeaderboardCards } from './LeaderboardCards'

interface LeaderboardEntry {
  id: string
  userId: string
  totalPoints: number
  totalPredictions: number
  correctPredictions: number
  exactScores: number
  ranking: number
  previousRanking: number | null
  rankingChange: number
  accuracyRate: number | string
  updatedAt: string
  user: {
    id: string
    name: string
    avatarUrl: string | null
  }
}

interface LeaderboardViewProps {
  entries: LeaderboardEntry[]
  currentUserId?: string
}

export function LeaderboardView({
  entries,
  currentUserId,
}: LeaderboardViewProps) {
  return (
    <>
      {/* Desktop: Table */}
      <div className="hidden md:block">
        <LeaderboardTable entries={entries} currentUserId={currentUserId} />
      </div>

      {/* Mobile: Cards */}
      <div className="block md:hidden">
        <LeaderboardCards entries={entries} currentUserId={currentUserId} />
      </div>
    </>
  )
}

