'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  // Inicializar el estado basado en si hay token o no
  const [status, setStatus] = useState<
    'validating' | 'idle' | 'loading' | 'success' | 'error'
  >(token ? 'validating' : 'error')
  const [message, setMessage] = useState(token ? '' : 'Token no proporcionado')
  const [tokenValid, setTokenValid] = useState(false)

  // Validar el token al cargar la página
  useEffect(() => {
    // Si no hay token, ya se manejó en el estado inicial
    if (!token) {
      return
    }

    // Verificar que el token existe y es válido
    fetch(`/api/auth/validate-reset-token?token=${token}`)
      .then(async (res) => {
        const data = await res.json()
        if (res.ok) {
          setStatus('idle')
          setTokenValid(true)
        } else {
          setStatus('error')
          setMessage(data.error || 'Token inválido')
          setTokenValid(false)
        }
      })
      .catch(() => {
        setStatus('error')
        setMessage('Error al validar el token')
        setTokenValid(false)
      })
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validar que las contraseñas coinciden
    if (password !== confirmPassword) {
      setStatus('error')
      setMessage('Las contraseñas no coinciden')
      return
    }

    if (!token) {
      setStatus('error')
      setMessage('Token no proporcionado')
      return
    }

    setStatus('loading')

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })

      const data = await res.json()

      if (res.ok) {
        setStatus('success')
        setMessage(data.message)
        // Redirigir al login después de 3 segundos
        setTimeout(() => router.push('/login'), 3000)
      } else {
        setStatus('error')
        setMessage(data.error || 'Error al restablecer la contraseña')
      }
    } catch (error) {
      setStatus('error')
      setMessage('Error de conexión')
    }
  }

  // Mostrar loading mientras valida el token
  if (status === 'validating') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-600 to-pink-500 px-4">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-2xl">
          <div className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600"></div>
            <p className="text-gray-600">Validando token...</p>
          </div>
        </div>
      </div>
    )
  }

  // Mostrar error si el token no es válido
  if (!tokenValid) {
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
              Token inválido
            </h1>
            <p className="text-gray-600">{message}</p>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg bg-yellow-50 p-4">
              <h2 className="mb-2 font-semibold text-yellow-900">
                ¿Qué podés hacer?
              </h2>
              <ul className="space-y-2 text-sm text-yellow-800">
                <li className="flex items-start">
                  <span className="mr-2">📧</span>
                  <span>Solicitá un nuevo link de recuperación</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">🔍</span>
                  <span>Verificá que copiaste el link completo</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">⏱️</span>
                  <span>Los links expiran en 1 hora</span>
                </li>
              </ul>
            </div>

            <Link
              href="/forgot-password"
              className="block w-full rounded-lg bg-gradient-to-r from-red-600 to-orange-500 py-3 text-center font-semibold text-white transition hover:from-red-700 hover:to-orange-600"
            >
              Solicitar nuevo link
            </Link>

            <Link
              href="/login"
              className="block text-center text-sm text-gray-600 hover:text-gray-900"
            >
              ← Volver a iniciar sesión
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-600 to-pink-500 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
            <svg
              className="h-8 w-8 text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            Nueva contraseña
          </h1>
          <p className="text-gray-600">Ingresá tu nueva contraseña</p>
        </div>

        {status === 'success' ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-green-50 p-4">
              <div className="flex">
                <svg
                  className="h-5 w-5 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <div className="ml-3">
                  <p className="text-sm text-green-800">{message}</p>
                  <p className="mt-2 text-xs text-green-700">
                    Serás redirigido al inicio de sesión...
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Nueva contraseña
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none"
                placeholder="Mínimo 8 caracteres"
              />
              <p className="mt-1 text-xs text-gray-500">
                Debe contener al menos 8 caracteres, una mayúscula y un número
              </p>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700"
              >
                Confirmar contraseña
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none"
                placeholder="Repetir contraseña"
              />
            </div>

            {status === 'error' && (
              <div className="rounded-lg bg-red-50 p-4">
                <p className="text-sm text-red-800">{message}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-pink-500 py-3 font-semibold text-white transition hover:from-purple-700 hover:to-pink-600 disabled:opacity-50"
            >
              {status === 'loading'
                ? 'Actualizando...'
                : 'Actualizar contraseña'}
            </button>

            <div className="text-center">
              <Link
                href="/login"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                ← Volver a iniciar sesión
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900"></div>
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  )
}
