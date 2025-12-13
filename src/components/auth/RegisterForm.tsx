'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
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
import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrengthIndicator'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  registerSchema,
  type RegisterInput,
} from '@/lib/validations/auth'
import { AlertCircle, Loader2, CheckCircle2 } from 'lucide-react'

export function RegisterForm() {
  const router = useRouter()
  const [error, setError] = React.useState<string>('')
  const [success, setSuccess] = React.useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    mode: 'onChange', // Validación en tiempo real
  })

  const password = watch('password')

  // Focus en el primer campo al montar
  React.useEffect(() => {
    const timer = setTimeout(() => {
      document.getElementById('name')?.focus()
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  // Limpiar errores cuando el usuario escribe
  React.useEffect(() => {
    const subscription = watch(() => setError(''))
    return () => subscription.unsubscribe()
  }, [watch])

  const onSubmit = async (data: RegisterInput) => {
    setError('')
    setSuccess(false)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          // confirmPassword no se envía a la API
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        // Manejar diferentes tipos de errores
        if (result.details && Array.isArray(result.details)) {
          // Errores de validación de Zod
          const firstError = result.details[0]
          setError(firstError.message || result.error || 'Error al registrar')
        } else {
          setError(result.error || 'Error al registrar. Por favor, intenta de nuevo.')
        }
        return
      }

      // Éxito
      setSuccess(true)
      // Opcional: redirigir después de unos segundos
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } catch {
      setError('Ocurrió un error inesperado. Por favor, intenta de nuevo.')
    }
  }

  if (success) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">¡Registro exitoso!</h3>
              <p className="text-sm text-muted-foreground">
                Te hemos enviado un email de verificación. Por favor, revisa tu bandeja
                de entrada para activar tu cuenta.
              </p>
              <p className="text-xs text-muted-foreground">
                Serás redirigido al login en unos segundos...
              </p>
            </div>
            <Button asChild variant="outline" className="w-full">
              <Link href="/login">Ir a iniciar sesión</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">Crear Cuenta</CardTitle>
        <CardDescription>
          Completa el formulario para registrarte
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              type="text"
              placeholder="Tu nombre completo"
              autoComplete="name"
              disabled={isSubmitting}
              {...register('name', {
                onChange: () => setError(''),
              })}
              aria-invalid={errors.name ? 'true' : 'false'}
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-destructive text-sm" role="alert">
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              autoComplete="email"
              disabled={isSubmitting}
              {...register('email', {
                onChange: () => setError(''),
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
              autoComplete="new-password"
              disabled={isSubmitting}
              {...register('password')}
              aria-invalid={errors.password ? 'true' : 'false'}
              className={errors.password ? 'border-destructive' : ''}
            />
            {password && <PasswordStrengthIndicator password={password} />}
            {errors.password && (
              <p className="text-destructive text-sm" role="alert">
                {errors.password.message}
              </p>
            )}
            <p className="text-muted-foreground text-xs">
              Mínimo 8 caracteres, una mayúscula y un número
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
            <PasswordInput
              id="confirmPassword"
              placeholder="••••••••"
              autoComplete="new-password"
              disabled={isSubmitting}
              {...register('confirmPassword')}
              aria-invalid={errors.confirmPassword ? 'true' : 'false'}
              className={errors.confirmPassword ? 'border-destructive' : ''}
            />
            {errors.confirmPassword && (
              <p className="text-destructive text-sm" role="alert">
                {errors.confirmPassword.message}
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
                Creando cuenta...
              </>
            ) : (
              'Crear Cuenta'
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <div className="text-muted-foreground text-center text-sm">
          ¿Ya tienes una cuenta?{' '}
          <Link href="/login" className="text-primary hover:underline">
            Inicia sesión
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}

