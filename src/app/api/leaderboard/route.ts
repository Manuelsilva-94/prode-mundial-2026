import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuthUser } from '@/lib/auth/session'
import { handleApiError } from '@/lib/api/error-handler'

export async function GET(req: NextRequest) {
  try {
    // Paginación
    const { searchParams } = new URL(req.url)
    const page = Number(searchParams.get('page')) || 1
    const limit = Number(searchParams.get('limit')) || 50
    const skip = (page - 1) * limit

    // Filtros avanzados (futuro): faseId, teamId, desde/hasta/periodo
    // ---
    // const phaseId = searchParams.get('phaseId');
    // const teamId = searchParams.get('teamId');
    // const fromDate = searchParams.get('from');
    // const toDate = searchParams.get('to');
    // Si se requiere, estos filtros modificarían la query a Prediction y requerirían cálculos ad-hoc y no solo caché
    // ---

    // Obtener usuario autenticado
    let currentUser: Awaited<ReturnType<typeof requireAuthUser>> | null = null
    try {
      currentUser = await requireAuthUser()
    } catch {
      // Usuario no autenticado, continuar sin autenticación
    }

    // 1. Query paginada para el leaderboard principal
    const [rows, total] = await Promise.all([
      prisma.leaderboardCache.findMany({
        orderBy: [
          { totalPoints: 'desc' },
          { accuracyRate: 'desc' },
        ],
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
      }),
      prisma.leaderboardCache.count(),
    ])

    // 2. Si hay usuario autenticado y NO está en el top actual, incluir su posición y stats
    let personal: typeof rows[0] | null = null
    if (currentUser) {
      const existsInTop = rows.some((r) => r.userId === currentUser.id)
      if (!existsInTop) {
        personal = await prisma.leaderboardCache.findUnique({
          where: { userId: currentUser.id },
          include: {
            user: {
              select: { id: true, name: true, avatarUrl: true },
            },
          },
        })
      }
    }

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
      personal,
    })
  } catch (error) {
    return handleApiError(error)
  }
}


