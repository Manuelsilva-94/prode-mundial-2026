import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { handleApiError } from '@/lib/api/error-handler'
import { createMatchSchema, matchQuerySchema } from '@/lib/validations/match'
import { subHours } from 'date-fns'

/**
 * GET /api/admin/matches
 * Lista todos los partidos con filtros (solo admin)
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin()

    const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries())
    const query = matchQuerySchema.parse(searchParams)

    const { page, limit, phaseId, status, search, orderBy, order } = query
    const skip = (page - 1) * limit

    // Construir where clause
    const where: Record<string, unknown> = {}

    if (phaseId) {
      where.phaseId = phaseId
    }

    if (status) {
      where.status = status
    }

    if (search) {
      where.OR = [
        { homeTeam: { name: { contains: search, mode: 'insensitive' } } },
        { awayTeam: { name: { contains: search, mode: 'insensitive' } } },
        { homeTeam: { code: { contains: search, mode: 'insensitive' } } },
        { awayTeam: { code: { contains: search, mode: 'insensitive' } } },
        { stadium: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Construir orderBy
    let orderByClause: Record<string, unknown> = {}
    if (orderBy === 'date') {
      orderByClause = { matchDate: order }
    } else if (orderBy === 'status') {
      orderByClause = { status: order }
    } else if (orderBy === 'phase') {
      orderByClause = { phase: { sortOrder: order } }
    }

    // Ejecutar consultas
    const [matches, total] = await Promise.all([
      prisma.match.findMany({
        where,
        include: {
          homeTeam: {
            select: { id: true, name: true, code: true, flagUrl: true },
          },
          awayTeam: {
            select: { id: true, name: true, code: true, flagUrl: true },
          },
          phase: {
            select: { id: true, name: true, slug: true },
          },
          _count: {
            select: { predictions: true },
          },
        },
        orderBy: orderByClause,
        skip,
        take: limit,
      }),
      prisma.match.count({ where }),
    ])

    return NextResponse.json({
      data: matches,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/admin/matches
 * Crear un nuevo partido (solo admin)
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    const body = await request.json()
    const data = createMatchSchema.parse(body)

    // Calcular lockTime (1 hora antes del partido)
    const matchDate = new Date(data.matchDate)
    const lockTime = subHours(matchDate, 1)

    const match = await prisma.match.create({
      data: {
        homeTeamId: data.homeTeamId,
        awayTeamId: data.awayTeamId,
        matchDate,
        stadium: data.stadium,
        city: data.city,
        country: data.country,
        phaseId: data.phaseId,
        groupLetter: data.groupLetter || null,
        lockTime,
        status: 'SCHEDULED',
      },
      include: {
        homeTeam: {
          select: { id: true, name: true, code: true, flagUrl: true },
        },
        awayTeam: {
          select: { id: true, name: true, code: true, flagUrl: true },
        },
        phase: {
          select: { id: true, name: true, slug: true },
        },
      },
    })

    return NextResponse.json({ data: match }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
