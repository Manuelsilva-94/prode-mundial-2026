import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendWelcomeEmail } from '@/lib/email/email-service'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')
    const format = searchParams.get('format') // 'json' para respuesta JSON

    // 1. Validar que existe el token
    if (!token) {
      if (format === 'json') {
        return NextResponse.json(
          { success: false, error: 'Token no proporcionado', reason: 'missing_token' },
          { status: 400 }
        )
      }
      return NextResponse.redirect(
        new URL('/verify-error?reason=missing_token', request.url)
      )
    }

    // 2. Buscar usuario con ese token
    const user = await prisma.user.findFirst({
      where: {
        verificationToken: token,
      },
    })

    // 3. Caso: Token no existe en DB
    if (!user) {
      if (format === 'json') {
        return NextResponse.json(
          { success: false, error: 'Token inválido', reason: 'invalid_token' },
          { status: 400 }
        )
      }
      return NextResponse.redirect(
        new URL('/verify-error?reason=invalid_token', request.url)
      )
    }

    // 4. Caso: Usuario ya verificado
    if (user.emailVerified) {
      if (format === 'json') {
        return NextResponse.json(
          { success: false, error: 'Ya verificado', reason: 'already_verified' },
          { status: 400 }
        )
      }
      return NextResponse.redirect(
        new URL('/verify-error?reason=already_verified', request.url)
      )
    }

    // 5. Caso: Token expirado
    if (
      user.verificationTokenExpiry &&
      user.verificationTokenExpiry < new Date()
    ) {
      if (format === 'json') {
        return NextResponse.json(
          { success: false, error: 'Token expirado', reason: 'expired_token' },
          { status: 400 }
        )
      }
      return NextResponse.redirect(
        new URL('/verify-error?reason=expired_token', request.url)
      )
    }

    // 6. Verificar la cuenta (todo OK)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null, // Eliminar el token usado
        verificationTokenExpiry: null, // Eliminar la expiración
      },
    })

    // 7. Enviar email de bienvenida (opcional, no bloquea)
    sendWelcomeEmail(user.email, user.name).catch((error) => {
      console.error('Error enviando email de bienvenida:', error)
    })

    // 8. Responder según el formato
    if (format === 'json') {
      return NextResponse.json({ success: true, message: 'Email verificado exitosamente' })
    }

    // Redirigir a página de éxito
    return NextResponse.redirect(new URL('/verify-success', request.url))
  } catch (error) {
    console.error('Error verificando email:', error)
    if (request.nextUrl.searchParams.get('format') === 'json') {
      return NextResponse.json(
        { success: false, error: 'Error del servidor', reason: 'server_error' },
        { status: 500 }
      )
    }
    return NextResponse.redirect(
      new URL('/verify-error?reason=server_error', request.url)
    )
  }
}
