import { NextRequest, NextResponse } from 'next/server'
import { requireAuthUser } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { handleApiError } from '@/lib/api/error-handler'
import { predictionsMeQuerySchema } from '@/lib/validations/predictions-query'
import { Prisma } from '@prisma/client'

/**
 * GET /api/predictions/me
 * Obtiene las predicciones del usuario autenticado con filtros y ordenamiento
 * Query params:
 *   - phaseId: Filtrar por fase (UUID)
 *   - phaseSlug: Filtrar por slug de fase
 *   - result: Filtrar por resultado ('correct', 'incorrect', 'exact')
 *   - orderBy: Ordenar por ('date', 'points', 'created') - default: 'date'
 *   - order: Orden ('asc', 'desc') - default: 'desc'
 *   - page: Página (default: 1)
 *   - limit: Límite por página (default: 20, max: 100)
 */
export async function GET(req: NextRequest) {
  try {
    // Usuario autenticado
    const currentUser = await requireAuthUser()

    // Validar query params
    const searchParams = Object.fromEntries(req.nextUrl.searchParams.entries())
    const query = predictionsMeQuerySchema.parse(searchParams)

    const { phaseId, phaseSlug, result, orderBy, order, page, limit } = query
    const skip = (page - 1) * limit

    // Construir WHERE clause
    const where: Prisma.PredictionWhereInput = {
      userId: currentUser.id,
    }

    // Filtro por fase
    if (phaseId || phaseSlug) {
      where.match = {
        ...where.match,
        phase: {
          ...(phaseId && { id: phaseId }),
          ...(phaseSlug && { slug: phaseSlug }),
        },
      } as Prisma.PredictionWhereInput['match']
    }

    // Filtro por resultado
    if (result) {
      if (result === 'correct') {
        // Predicciones con puntos > 0
        where.pointsEarned = { gt: 0 }
      } else if (result === 'incorrect') {
        // Predicciones con puntos = 0 y partido finalizado
        where.pointsEarned = 0
        where.match = {
          ...where.match,
          status: 'FINISHED',
        } as Prisma.PredictionWhereInput['match']
      } else if (result === 'exact') {
        // Resultado exacto (puntos > 0 y coinciden ambos marcadores)
        where.AND = [
          { pointsEarned: { gt: 0 } },
          {
            match: {
              status: 'FINISHED',
            },
          },
        ]
        // Nota: La verificación de resultado exacto requiere comparar
        // predictedHomeScore/awayScore con homeScore/awayScore del match
        // Esto se hace mejor en la aplicación, pero podemos aproximarlo
        // filtrando por puntosEarned alto (los exactos tienen más puntos)
        // Una mejor implementación sería calcular esto en el cliente o agregar
        // un campo booleano isExactScore en la tabla Prediction
      }
    }

    // Construir ORDER BY clause
    let orderByClause: Prisma.PredictionOrderByWithRelationInput = {}
    if (orderBy === 'date') {
      orderByClause = { match: { matchDate: order } }
    } else if (orderBy === 'points') {
      orderByClause = { pointsEarned: order }
    } else if (orderBy === 'created') {
      orderByClause = { createdAt: order }
    }

    // Obtener predicciones
    const [predictions, total] = await Promise.all([
      prisma.prediction.findMany({
        where,
        include: {
          match: {
            select: {
              id: true,
              matchDate: true,
              lockTime: true,
              status: true,
              homeScore: true,
              awayScore: true,
              isLocked: true,
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
          },
        },
        orderBy: orderByClause,
        skip,
        take: limit,
      }),
      prisma.prediction.count({ where }),
    ])

    // Enriquecer con información de si es exacto (cuando el partido está finalizado)
    const enrichedPredictions = predictions.map((prediction) => {
      const isExact =
        prediction.match.status === 'FINISHED' &&
        prediction.match.homeScore !== null &&
        prediction.match.awayScore !== null &&
        prediction.predictedHomeScore === prediction.match.homeScore &&
        prediction.predictedAwayScore === prediction.match.awayScore

      return {
        ...prediction,
        isExact,
      }
    })

    // Filtrar por 'exact' si es necesario (post-procesamiento)
    let filteredPredictions = enrichedPredictions
    if (result === 'exact') {
      filteredPredictions = enrichedPredictions.filter((p) => p.isExact)
    }

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      data: filteredPredictions,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
