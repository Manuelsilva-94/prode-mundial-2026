// app/api/admin/matches/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/session'
import { handleApiError } from '@/lib/api/error-handler'
import { prisma } from '@/lib/db'
import {
  updateMatchSchema,
  validateMatchUpdate,
  validateMatchDeletion,
  calculateLockTime,
  isMatchLocked,
} from '@/lib/validations/match'
import { Prisma } from '@prisma/client'
import { calculatePointsForMatch } from '@/lib/scoring/match-processor'

/**
 * GET /api/admin/matches/:id
 * Obtiene un partido específico con todos sus detalles
 * Solo accesible por administradores
 */
export async function GET(
  _req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()

    // Await params en Next.js 15
    const params = await props.params

    const match = await prisma.match.findUnique({
      where: { id: params.id },
      include: {
        homeTeam: {
          select: {
            id: true,
            name: true,
            fullName: true,
            code: true,
            flagUrl: true,
            groupLetter: true,
          },
        },
        awayTeam: {
          select: {
            id: true,
            name: true,
            fullName: true,
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
        predictions: {
          select: {
            id: true,
            predictedHomeScore: true,
            predictedAwayScore: true,
            pointsEarned: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    if (!match) {
      return NextResponse.json(
        { error: 'Partido no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: match })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PATCH /api/admin/matches/:id
 * Actualiza un partido existente
 * Solo accesible por administradores
 */
export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()

    // Await params en Next.js 15
    const params = await props.params

    const body = await req.json()

    // Validar schema
    const validatedData = updateMatchSchema.parse(body)

    // Validaciones de negocio
    const validationErrors = await validateMatchUpdate(params.id, validatedData)
    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          error: 'Errores de validación',
          details: validationErrors,
        },
        { status: 400 }
      )
    }

    // Preparar datos para actualización con tipo específico
    const updateData: Prisma.MatchUpdateInput = {}

    // Asignar campos uno por uno
    if (validatedData.homeTeamId) {
      updateData.homeTeam = { connect: { id: validatedData.homeTeamId } }
    }
    if (validatedData.awayTeamId) {
      updateData.awayTeam = { connect: { id: validatedData.awayTeamId } }
    }
    if (validatedData.phaseId) {
      updateData.phase = { connect: { id: validatedData.phaseId } }
    }
    if (validatedData.stadium !== undefined) {
      updateData.stadium = validatedData.stadium
    }
    if (validatedData.city !== undefined) {
      updateData.city = validatedData.city
    }
    if (validatedData.country !== undefined) {
      updateData.country = validatedData.country
    }
    if (validatedData.groupLetter !== undefined) {
      updateData.groupLetter = validatedData.groupLetter
    }
    if (validatedData.status !== undefined) {
      updateData.status = validatedData.status
    }
    if (validatedData.homeScore !== undefined) {
      updateData.homeScore = validatedData.homeScore
    }
    if (validatedData.awayScore !== undefined) {
      updateData.awayScore = validatedData.awayScore
    }

    // Recalcular lockTime si cambia la fecha
    if (validatedData.matchDate) {
      const matchDate = new Date(validatedData.matchDate)
      updateData.matchDate = matchDate
      updateData.lockTime = calculateLockTime(matchDate)
      updateData.isLocked = isMatchLocked(updateData.lockTime)
    }

    // Actualizar partido
    const match = await prisma.match.update({
      where: { id: params.id },
      data: updateData,
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
        _count: {
          select: {
            predictions: true,
          },
        },
      },
    })

    if (
      (validatedData.homeScore !== undefined ||
        validatedData.awayScore !== undefined) &&
      match.status === 'FINISHED'
    ) {
      console.log(
        '🔄 Scores actualizados en partido finalizado, recalculando puntos...'
      )

      try {
        await calculatePointsForMatch(params.id)
        console.log('✅ Puntos recalculados automáticamente')
      } catch (error) {
        console.error('❌ Error al recalcular puntos:', error)
        // No fallar la actualización del partido por esto
      }
    }

    return NextResponse.json({
      message: 'Partido actualizado exitosamente',
      data: match,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * DELETE /api/admin/matches/:id
 * Elimina un partido (con sus predicciones si existen)
 * Solo accesible por administradores
 * Query param: ?confirmed=true para confirmar eliminación con predicciones
 */
export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()

    // Await params en Next.js 15
    const params = await props.params

    const searchParams = req.nextUrl.searchParams
    const confirmed = searchParams.get('confirmed') === 'true'

    // Validar que se pueda eliminar
    const validationErrors = await validateMatchDeletion(params.id)

    // Si hay predicciones y no está confirmado, requerir confirmación
    if (validationErrors.length > 0 && !confirmed) {
      return NextResponse.json(
        {
          error: 'Confirmación requerida',
          details: validationErrors,
          message:
            'Para eliminar este partido con predicciones, agrega ?confirmed=true a la URL',
        },
        { status: 400 }
      )
    }

    // Eliminar predicciones primero (si existen)
    await prisma.prediction.deleteMany({
      where: { matchId: params.id },
    })

    // Eliminar el partido
    const match = await prisma.match.delete({
      where: { id: params.id },
    })

    return NextResponse.json({
      message: 'Partido eliminado exitosamente',
      data: match,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
