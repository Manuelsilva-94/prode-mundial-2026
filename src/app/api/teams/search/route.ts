import { NextRequest, NextResponse } from 'next/server'
import { handleApiError } from '@/lib/api/error-handler'
import { searchTeamSchema } from '@/lib/validations/team'
import { findTeamByCode } from '@/lib/utils/team'

/**
 * GET /api/teams/search?code=XXX
 * Buscar equipo por código de invitación
 * Público - no requiere autenticación para solo ver la info
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const codeParam = searchParams.get('code')

    if (!codeParam) {
      return NextResponse.json(
        {
          error: 'Código requerido',
          details: ['Debes proporcionar un código de invitación en el parámetro "code"'],
        },
        { status: 400 }
      )
    }

    // Validar formato del código
    const validatedCode = searchTeamSchema.parse({ code: codeParam })

    // Buscar equipo por código (case-insensitive)
    const team = await findTeamByCode(validatedCode.code)

    if (!team) {
      return NextResponse.json(
        {
          error: 'Equipo no encontrado',
          details: ['El código de invitación no corresponde a ningún equipo.'],
        },
        { status: 404 }
      )
    }

    // Retornar información pública del equipo (sin datos sensibles)
    return NextResponse.json({
      id: team.id,
      name: team.name,
      description: team.description,
      creator: {
        id: team.creator.id,
        name: team.creator.name,
        avatarUrl: team.creator.avatarUrl,
      },
      memberCount: team._count.members,
      createdAt: team.createdAt,
      // No retornamos el inviteCode por seguridad
    })
  } catch (error) {
    return handleApiError(error)
  }
}

