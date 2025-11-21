import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'

/**
 * Maneja errores de forma consistente en los endpoints
 */
export function handleApiError(error: unknown) {
  console.error('API Error:', error)

  // Error personalizado con status
  if (error instanceof Error && 'status' in error) {
    return NextResponse.json(
      { error: error.message },
      { status: (error as Error & { status: number }).status }
    )
  }

  // Errores de validación Zod
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

  // Errores de Prisma
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Constraint violation (ej: unique)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Ya existe un registro con estos datos' },
        { status: 409 }
      )
    }

    // Record not found
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Registro no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Error de base de datos' },
      { status: 500 }
    )
  }

  // Error genérico
  return NextResponse.json(
    { error: 'Error interno del servidor' },
    { status: 500 }
  )
}
