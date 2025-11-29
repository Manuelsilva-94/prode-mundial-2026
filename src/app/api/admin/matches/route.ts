// app/api/admin/matches/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/session'
import { handleApiError } from '@/lib/api/error-handler'
import { prisma } from '@/lib/db'
import {
  adminMatchFiltersSchema,
  createMatchSchema,
  validateMatchCreation,
  calculateLockTime,
} from '@/lib/validations/match'
import { Prisma } from '@prisma/client'

/**
 * GET /api/admin/matches
 * Lista todos los partidos con filtros, paginación y búsqueda
 * Solo accesible por administradores
 */
export async function GET(req: NextRequest) {
  try {
    // Validar que sea admin
    await requireAdmin()

    // Parse y validar query params
    const searchParams = Object.fromEntries(req.nextUrl.searchParams)
    const filters = adminMatchFiltersSchema.parse(searchParams)

    const {
      page,
      limit,
      phase,
      team,
      status,
      dateFrom,
      dateTo,
      search,
      sortBy,
      sortOrder,
    } = filters

    // Construir filtros dinámicamente
    const where: Prisma.MatchWhereInput = {}

    if (phase) {
      where.phaseId = phase
    }

    if (team) {
      where.OR = [{ homeTeamId: team }, { awayTeamId: team }]
    }

    if (status) {
      where.status = status
    }

    if (dateFrom || dateTo) {
      where.matchDate = {}
      if (dateFrom) {
        where.matchDate.gte = new Date(dateFrom)
      }
      if (dateTo) {
        where.matchDate.lte = new Date(dateTo)
      }
    }

    // Búsqueda por texto (stadium, city, country, Y NOMBRES DE EQUIPOS)
    if (search) {
      where.OR = [
        { stadium: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { country: { contains: search, mode: 'insensitive' } },
        // Búsqueda por nombre de equipo local
        {
          homeTeam: {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { fullName: { contains: search, mode: 'insensitive' } },
              { code: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
        // Búsqueda por nombre de equipo visitante
        {
          awayTeam: {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { fullName: { contains: search, mode: 'insensitive' } },
              { code: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
      ]
    }

    // Calcular paginación
    const skip = (page - 1) * limit

    // Ejecutar queries en paralelo
    const [matches, total] = await Promise.all([
      prisma.match.findMany({
        where,
        include: {
          homeTeam: {
            select: {
              id: true,
              name: true,
              code: true,
              flagUrl: true,
              groupLetter: true,
            },
          },
          awayTeam: {
            select: {
              id: true,
              name: true,
              code: true,
              flagUrl: true,
              groupLetter: true,
            },
          },
          phase: {
            select: {
              id: true,
              name: true,
              slug: true,
              sortOrder: true,
              pointsMultiplier: true,
            },
          },
          _count: {
            select: {
              predictions: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      prisma.match.count({ where }),
    ])

    // Calcular metadata de paginación
    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      data: matches,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * POST /api/admin/matches
 * Crea un nuevo partido
 * Solo accesible por administradores
 */
export async function POST(req: NextRequest) {
  try {
    // Validar que sea admin
    await requireAdmin()

    const body = await req.json()

    // Validar schema
    const validatedData = createMatchSchema.parse(body)

    // Validaciones de negocio
    const validationErrors = await validateMatchCreation(validatedData)
    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          error: 'Errores de validación',
          details: validationErrors,
        },
        { status: 400 }
      )
    }

    // Calcular lockTime automáticamente (15 min antes del partido)
    const matchDate = new Date(validatedData.matchDate)
    const lockTime = calculateLockTime(matchDate)

    // Crear partido
    const match = await prisma.match.create({
      data: {
        homeTeamId: validatedData.homeTeamId,
        awayTeamId: validatedData.awayTeamId,
        phaseId: validatedData.phaseId,
        matchDate,
        lockTime,
        stadium: validatedData.stadium,
        city: validatedData.city,
        country: validatedData.country,
        groupLetter: validatedData.groupLetter,
        status: 'SCHEDULED',
        isLocked: false,
      },
      include: {
        homeTeam: {
          select: {
            id: true,
            name: true,
            code: true,
            flagUrl: true,
          },
        },
        awayTeam: {
          select: {
            id: true,
            name: true,
            code: true,
            flagUrl: true,
          },
        },
        phase: {
          select: {
            id: true,
            name: true,
            slug: true,
            pointsMultiplier: true,
          },
        },
      },
    })

    return NextResponse.json(
      {
        message: 'Partido creado exitosamente',
        data: match,
      },
      { status: 201 }
    )
  } catch (error) {
    return handleApiError(error)
  }
}
