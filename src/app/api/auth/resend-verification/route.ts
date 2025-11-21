import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendVerificationEmail } from '@/lib/email/email-service'
import { generateVerificationToken } from '@/lib/utils/crypto'
import { z } from 'zod'

const resendSchema = z.object({
  email: z.string().email('Email inválido'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = resendSchema.parse(body)

    // Buscar el usuario
    const user = await prisma.user.findUnique({
      where: { email },
    })

    // Por seguridad, siempre devolver el mismo mensaje
    const successMessage =
      'Si el email existe y no está verificado, recibirás un nuevo link.'

    if (!user) {
      return NextResponse.json({ message: successMessage }, { status: 200 })
    }

    // Si ya está verificado, no hacer nada
    if (user.emailVerified) {
      return NextResponse.json({ message: successMessage }, { status: 200 })
    }

    // Generar nuevo token
    const verificationToken = generateVerificationToken()
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000)

    // Actualizar token en DB
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken,
        verificationTokenExpiry,
      },
    })

    // Enviar email
    sendVerificationEmail(user.email, verificationToken, user.name).catch(
      (error) => {
        console.error('Error enviando email de verificación:', error)
      }
    )

    return NextResponse.json({ message: successMessage }, { status: 200 })
  } catch (error) {
    console.error('Error en resend-verification:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
