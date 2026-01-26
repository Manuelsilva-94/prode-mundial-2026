import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { handleApiError } from '@/lib/api/error-handler'

/**
 * GET /api/admin/teams
 * Lista todos los equipos de fútbol (solo admin)
 */
export async function GET() {
  try {
    await requireAdmin()

    const teams = await prisma.footballTeam.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        code: true,
        flagUrl: true,
        groupLetter: true,
      },
    })

    return NextResponse.json({ data: teams })
  } catch (error) {
    return handleApiError(error)
  }
}

