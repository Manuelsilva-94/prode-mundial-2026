'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ResendVerificationPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')

    try {
      const res = await fetch('/api/auth/resend-verification', {
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
        setMessage(data.error || 'Error al enviar el email')
      }
    } catch (error) {
      setStatus('error')
      setMessage('Error de conexión')
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-600 to-blue-500 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            Reenviar verificación
          </h1>
          <p className="text-gray-600">
            Ingresá tu email para recibir un nuevo link de verificación
          </p>
        </div>

        {status === 'success' ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-green-50 p-4">
              <p className="text-sm text-green-800">{message}</p>
            </div>
            <Link
              href="/"
              className="block text-center text-sm text-gray-600 hover:text-gray-900"
            >
              Volver al inicio
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
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none"
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
              className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-blue-500 py-3 font-semibold text-white transition hover:from-purple-700 hover:to-blue-600 disabled:opacity-50"
            >
              {status === 'loading' ? 'Enviando...' : 'Reenviar email'}
            </button>

            <Link
              href="/"
              className="block text-center text-sm text-gray-600 hover:text-gray-900"
            >
              Volver al inicio
            </Link>
          </form>
        )}
      </div>
    </div>
  )
}
