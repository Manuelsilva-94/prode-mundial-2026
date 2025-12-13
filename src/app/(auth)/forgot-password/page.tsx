'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (res.ok) {
        setStatus('success')
        setMessage(data.message)
      } else {
        setStatus('error')
        setMessage(data.error || 'Error al procesar la solicitud')
      }
    } catch {
      setStatus('error')
      setMessage('Error de conexión')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-pink-500 to-rose-500 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-pink-100">
            <svg
              className="h-8 w-8 text-pink-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
          </div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            ¿Olvidaste tu contraseña?
          </h1>
          <p className="text-gray-600">
            Ingresá tu email y te enviaremos un link para restablecerla
          </p>
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
                    Revisá tu casilla de correo y spam. El link expira en 1
                    hora.
                  </p>
                </div>
              </div>
            </div>
            <Link
              href="/login"
              className="block text-center text-sm text-gray-600 hover:text-gray-900"
            >
              Volver a iniciar sesión
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 focus:outline-none"
                placeholder="tu@email.com"
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
              className="w-full rounded-lg bg-linear-to-r from-pink-500 to-rose-500 py-3 font-semibold text-white transition hover:from-pink-600 hover:to-rose-600 disabled:opacity-50"
            >
              {status === 'loading'
                ? 'Enviando...'
                : 'Enviar link de recuperación'}
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
