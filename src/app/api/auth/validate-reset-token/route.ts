import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')

    // Validar que existe el token
    if (!token) {
      return NextResponse.json(
        { error: 'Token no proporcionado' },
        { status: 400 }
      )
    }

    // Buscar usuario con ese token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
      },
    })

    // Validar que el token existe
    if (!user) {
      return NextResponse.json(
        { error: 'Token de reset inválido o ya fue usado' },
        { status: 400 }
      )
    }

    // Validar que el token no expiró
    if (!user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      return NextResponse.json(
        { error: 'El token de reset ha expirado (válido por 1 hora)' },
        { status: 400 }
      )
    }

    // Token válido
    return NextResponse.json({ valid: true }, { status: 200 })
  } catch (error) {
    console.error('Error validando token:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
