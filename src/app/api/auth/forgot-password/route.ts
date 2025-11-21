import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendPasswordResetEmail } from '@/lib/email/email-service'
import { generateVerificationToken } from '@/lib/utils/crypto'
import { forgotPasswordSchema } from '@/lib/validations/auth'
import { ZodError } from 'zod'

export async function POST(request: NextRequest) {
  try {
    // 1. Parsear y validar el body
    const body = await request.json()
    const { email } = forgotPasswordSchema.parse(body)

    // 2. Buscar el usuario
    const user = await prisma.user.findUnique({
      where: { email },
    })

    // 3. Por seguridad, siempre devolver el mismo mensaje
    // (no revelar si el email existe o no)
    const successMessage =
      'Si el email existe en nuestro sistema, recibirás un link para restablecer tu contraseña.'

    // Si el usuario no existe, devolver éxito pero no hacer nada
    if (!user) {
      console.log('⚠️ Intento de reset para email no registrado:', email)
      return NextResponse.json({ message: successMessage }, { status: 200 })
    }

    // 4. Generar token de reset con expiración de 1 hora
    const resetToken = generateVerificationToken()
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hora

    // 5. Guardar token en la base de datos
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    })

    // 6. Enviar email con el link de reset (no bloquea)
    sendPasswordResetEmail(user.email, resetToken, user.name)
      .then((result) => {
        if (result.success) {
          console.log('✅ Email de reset enviado a:', user.email)
        } else {
          console.error('❌ Error enviando email de reset:', result.error)
        }
      })
      .catch((error) => {
        console.error('❌ Error inesperado al enviar email:', error)
      })

    // 7. Responder con éxito
    return NextResponse.json({ message: successMessage }, { status: 200 })
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
    console.error('Error en forgot-password:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
