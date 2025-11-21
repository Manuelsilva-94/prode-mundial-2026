import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { resetPasswordSchema } from '@/lib/validations/auth'
import { ZodError } from 'zod'

export async function POST(request: NextRequest) {
  try {
    // 1. Parsear y validar el body
    const body = await request.json()
    const { token, password } = resetPasswordSchema.parse(body)

    // 2. Buscar usuario con ese token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
      },
    })

    // 3. Validar que el token existe
    if (!user) {
      return NextResponse.json(
        { error: 'Token de reset inválido o ya usado' },
        { status: 400 }
      )
    }

    // 4. Validar que el token no expiró
    if (!user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      return NextResponse.json(
        { error: 'El token de reset ha expirado. Solicitá uno nuevo.' },
        { status: 400 }
      )
    }

    // 5. Hashear la nueva contraseña
    const passwordHash = await bcrypt.hash(password, 10)

    // 6. Actualizar la contraseña e invalidar el token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null, // Invalidar el token
        resetTokenExpiry: null,
      },
    })

    console.log('✅ Contraseña actualizada para:', user.email)

    // 7. Responder con éxito
    return NextResponse.json(
      {
        message:
          'Contraseña actualizada exitosamente. Ya podés iniciar sesión.',
      },
      { status: 200 }
    )
  } catch (error) {
    // Manejo de errores de validación
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Datos de entrada inválidos',
          details: error.issues.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      )
    }

    // Error genérico
    console.error('Error en reset-password:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
