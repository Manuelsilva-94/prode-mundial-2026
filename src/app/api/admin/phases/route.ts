import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { handleApiError } from '@/lib/api/error-handler'

/**
 * GET /api/admin/phases
 * Lista todas las fases del torneo (solo admin)
 */
export async function GET() {
  try {
    await requireAdmin()

    const phases = await prisma.tournamentPhase.findMany({
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        sortOrder: true,
        pointsMultiplier: true,
      },
    })

    return NextResponse.json({ data: phases })
  } catch (error) {
    return handleApiError(error)
  }
}

