'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/auth/PasswordInput'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { loginSchema, type LoginInput } from '@/lib/validations/auth'
import { AlertCircle, Loader2 } from 'lucide-react'

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/home'
  const [error, setError] = React.useState<string>('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  // Focus en el primer campo al montar
  React.useEffect(() => {
    const timer = setTimeout(() => {
      document.getElementById('email')?.focus()
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  const onSubmit = async (data: LoginInput) => {
    setError('')

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: data.email.trim().toLowerCase(),
        password: data.password,
      })

      if (result?.error) {
        setError(
          'Credenciales no válidas. Por favor, verifica tu email y contraseña.'
        )
      } else {
        router.push(callbackUrl)
        router.refresh()
      }
    } catch {
      setError('Ocurrió un error inesperado. Por favor, intenta de nuevo.')
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">Iniciar Sesión</CardTitle>
        <CardDescription>
          Ingresa tus credenciales para acceder a tu cuenta
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              autoComplete="email"
              disabled={isSubmitting}
              {...register('email', {
                onChange: () => setError(''), // Limpiar error al escribir
              })}
              aria-invalid={errors.email ? 'true' : 'false'}
              className={errors.email ? 'border-destructive' : ''}
            />
            {errors.email && (
              <p className="text-destructive text-sm" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <PasswordInput
              id="password"
              placeholder="••••••••"
              autoComplete="current-password"
              disabled={isSubmitting}
              {...register('password')}
              aria-invalid={errors.password ? 'true' : 'false'}
              className={errors.password ? 'border-destructive' : ''}
            />
            {errors.password && (
              <p className="text-destructive text-sm" role="alert">
                {errors.password.message}
              </p>
            )}
          </div>

          {error && (
            <Alert variant="destructive" role="alert">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Iniciando sesión...
              </>
            ) : (
              'Iniciar Sesión'
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <div className="text-center text-sm">
          <Link
            href="/forgot-password"
            className="text-primary hover:underline"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <div className="text-muted-foreground text-center text-sm">
          ¿No tienes una cuenta?{' '}
          <Link href="/register" className="text-primary hover:underline">
            Regístrate
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}
