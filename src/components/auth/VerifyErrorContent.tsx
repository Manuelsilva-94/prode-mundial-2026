// components/VerifyErrorContent.tsx
'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export default function VerifyErrorContent() {
  const searchParams = useSearchParams()
  // Ya que este código se ejecuta en el cliente, acceder a searchParams es seguro.
  const reason = searchParams.get('reason') || 'unknown'

  const errorMessages: Record<
    string,
    { title: string; description: string; action: string }
  > = {
    missing_token: {
      title: 'Token no proporcionado',
      description: 'El link de verificación está incompleto.',
      action: 'Solicitá un nuevo email de verificación',
    },
    invalid_token: {
      title: 'Token inválido',
      description: 'El link de verificación no es válido o ya fue usado.',
      action: 'Solicitá un nuevo email de verificación',
    },
    already_verified: {
      title: 'Cuenta ya verificada',
      description: 'Tu cuenta ya está verificada. Podés iniciar sesión.',
      action: 'Ir a iniciar sesión',
    },
    expired_token: {
      title: 'Token expirado',
      description:
        'El link de verificación expiró. Los links son válidos por 24 horas.',
      action: 'Solicitá un nuevo email de verificación',
    },
    server_error: {
      title: 'Error del servidor',
      description: 'Ocurrió un error inesperado. Intentá nuevamente más tarde.',
      action: 'Volver al inicio',
    },
    unknown: {
      title: 'Error desconocido',
      description: 'Ocurrió un error que no pudimos identificar.',
      action: 'Contactar soporte',
    },
  }

  const error = errorMessages[reason] || errorMessages.unknown

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-600 to-orange-500 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-8 w-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            {error.title}
          </h1>
          <p className="text-gray-600">{error.description}</p>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg bg-yellow-50 p-4">
            <h2 className="mb-2 font-semibold text-yellow-900">
              ¿Qué podés hacer?
            </h2>
            <ul className="space-y-2 text-sm text-yellow-800">
              {reason === 'already_verified' ? (
                <li className="flex items-start">
                  <span className="mr-2">✅</span>
                  <span>Tu cuenta ya está lista para usar</span>
                </li>
              ) : (
                <>
                  <li className="flex items-start">
                    <span className="mr-2">📧</span>
                    <span>Solicitá un nuevo email de verificación</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">🔍</span>
                    <span>Verificá que copiaste el link completo</span>
                  </li>
                </>
              )}
              <li className="flex items-start">
                <span className="mr-2">💬</span>
                <span>Contactá a soporte si el problema persiste</span>
              </li>
            </ul>
          </div>

          {reason === 'already_verified' ? (
            <Link
              href="/auth/login"
              className="block w-full rounded-lg bg-gradient-to-r from-green-600 to-teal-500 py-3 text-center font-semibold text-white transition hover:from-green-700 hover:to-teal-600"
            >
              Iniciar sesión
            </Link>
          ) : (
            <Link
              href="/auth/resend-verification"
              className="block w-full rounded-lg bg-gradient-to-r from-red-600 to-orange-500 py-3 text-center font-semibold text-white transition hover:from-red-700 hover:to-orange-600"
            >
              {error.action}
            </Link>
          )}

          <Link
            href="/"
            className="block text-center text-sm text-gray-600 hover:text-gray-900"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
