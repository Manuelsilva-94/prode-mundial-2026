import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { registerSchema } from '@/lib/validations/auth'
import { generateVerificationToken } from '@/lib/utils/crypto'
import { sendVerificationEmail } from '@/lib/email/email-service'
import { Prisma } from '@prisma/client'
import { ZodError } from 'zod'

// Schema para la API (sin confirmPassword)
const registerApiSchema = registerSchema.omit({ confirmPassword: true })

export async function POST(request: NextRequest) {
  try {
    // 1. Parsear y validar el body (el schema del formulario ya validó confirmPassword)
    const body = await request.json()
    const validatedData = registerApiSchema.parse(body)

    // 2. Verificar si el email ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Este email ya está registrado' },
        { status: 409 }
      )
    }

    // 3. Hashear la contraseña
    const passwordHash = await bcrypt.hash(validatedData.password, 10)

    // 4. Generar token de verificación con expiración
    const verificationToken = generateVerificationToken()
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas

    // 5. Crear el usuario en la base de datos
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        name: validatedData.name,
        passwordHash,
        verificationToken,
        verificationTokenExpiry, // 👈 AGREGAR ESTA LÍNEA
        role: 'USER',
        emailVerified: false,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      },
    })

    // 6. Enviar email de verificación (no bloquea si falla)
    sendVerificationEmail(user.email, verificationToken, user.name)
      .then((result) => {
        if (result.success) {
          console.log('✅ Email enviado exitosamente')
        } else {
          console.error('❌ Error enviando email:', result.error)
        }
      })
      .catch((error) => {
        console.error('❌ Error inesperado al enviar email:', error)
      })

    // 7. Responder con éxito
    return NextResponse.json(
      {
        message:
          'Usuario registrado exitosamente. Revisá tu email para verificar tu cuenta.',
        user,
      },
      { status: 201 }
    )
  } catch (error) {
    // Manejo de errores de validación de Zod
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

    // Error de base de datos (Prisma)
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error('Error de Prisma:', error.code, error.message)
      return NextResponse.json(
        { error: 'Error al crear el usuario en la base de datos' },
        { status: 500 }
      )
    }

    // Error genérico
    console.error('Error inesperado:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
