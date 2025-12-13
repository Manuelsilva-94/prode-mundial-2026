'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle2, AlertCircle, Mail } from 'lucide-react'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  // Initialize state based on token presence
  const [status, setStatus] = useState<
    'loading' | 'success' | 'error' | 'idle'
  >(() => {
    if (!token) return 'error'
    return 'loading'
  })
  const [error, setError] = useState<string>(() => {
    if (!token) return 'Token no proporcionado'
    return ''
  })
  const [errorReason, setErrorReason] = useState<string>(() => {
    if (!token) return 'missing_token'
    return ''
  })

  useEffect(() => {
    // Skip if no token (already handled in initial state)
    if (!token) {
      return
    }

    // Llamar a la API de verificación con formato JSON
    fetch(`/api/auth/verify?token=${token}&format=json`, {
      method: 'GET',
    })
      .then(async (res) => {
        const data = await res.json()

        if (res.ok && data.success) {
          setStatus('success')
        } else {
          setStatus('error')
          setError(data.error || 'Error al verificar el email')
          setErrorReason(data.reason || 'server_error')
        }
      })
      .catch(() => {
        setStatus('error')
        setError('Error de conexión al verificar el email')
        setErrorReason('server_error')
      })
  }, [token])

  const handleResend = () => {
    router.push('/resend-verification')
  }

  if (status === 'loading') {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center space-y-4 py-8">
            <Loader2 className="text-primary h-12 w-12 animate-spin" />
            <p className="text-muted-foreground text-center text-sm">
              Verificando tu email...
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (status === 'success') {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold">
            ¡Email verificado!
          </CardTitle>
          <CardDescription>
            Tu cuenta ha sido verificada exitosamente. Ya podés iniciar sesión.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-lg bg-blue-50 p-4">
              <h3 className="mb-2 font-semibold text-blue-900">
                ¿Qué sigue ahora?
              </h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start">
                  <span className="mr-2">⚽</span>
                  <span>Iniciá sesión con tu cuenta</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">📊</span>
                  <span>Hacé tus predicciones</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">🏆</span>
                  <span>Competí con tus amigos</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button asChild className="w-full">
            <Link href="/login">Iniciar sesión</Link>
          </Button>
        </CardFooter>
      </Card>
    )
  }

  // Estado de error
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <AlertCircle className="h-8 w-8 text-red-600" />
        </div>
        <CardTitle className="text-2xl font-bold">
          {getErrorTitle(errorReason)}
        </CardTitle>
        <CardDescription>{getErrorDescription(errorReason)}</CardDescription>
      </CardHeader>
      <CardContent>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <Button onClick={handleResend} variant="outline" className="w-full">
          <Mail className="mr-2 h-4 w-4" />
          Reenviar email de verificación
        </Button>
        <Button asChild variant="ghost" className="w-full">
          <Link href="/login">Volver al login</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

function getErrorTitle(reason: string): string {
  switch (reason) {
    case 'missing_token':
      return 'Token no proporcionado'
    case 'invalid_token':
      return 'Token inválido'
    case 'already_verified':
      return 'Cuenta ya verificada'
    case 'expired_token':
      return 'Token expirado'
    case 'server_error':
      return 'Error del servidor'
    default:
      return 'Error desconocido'
  }
}

function getErrorDescription(reason: string): string {
  switch (reason) {
    case 'missing_token':
      return 'El link de verificación está incompleto.'
    case 'invalid_token':
      return 'El link de verificación no es válido o ya fue usado.'
    case 'already_verified':
      return 'Tu cuenta ya está verificada. Podés iniciar sesión directamente.'
    case 'expired_token':
      return 'El link de verificación expiró. Los links son válidos por 24 horas. Podés solicitar uno nuevo.'
    case 'server_error':
      return 'Ocurrió un error inesperado en el servidor. Por favor, intentá nuevamente más tarde.'
    default:
      return 'Ocurrió un error que no pudimos identificar. Por favor, contactá soporte si el problema persiste.'
  }
}

export default function VerifyEmailPage() {
  return (
    <main className="from-background to-muted flex min-h-screen flex-col items-center justify-center bg-linear-to-br p-4 sm:p-6">
      <div className="flex w-full max-w-md flex-col items-center space-y-6">
        <div className="flex flex-col items-center space-y-3">
          <div className="bg-primary text-primary-foreground flex h-16 w-16 items-center justify-center rounded-full text-2xl">
            ⚽
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight">
              Prode Mundial 2026
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Verificación de email
            </p>
          </div>
        </div>
        <Suspense
          fallback={
            <Card className="w-full max-w-md">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center space-y-4 py-8">
                  <Loader2 className="text-primary h-12 w-12 animate-spin" />
                  <p className="text-muted-foreground text-center text-sm">
                    Cargando...
                  </p>
                </div>
              </CardContent>
            </Card>
          }
        >
          <VerifyEmailContent />
        </Suspense>
      </div>
    </main>
  )
}
