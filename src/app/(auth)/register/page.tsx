'use client'

import { Suspense } from 'react'
import { RegisterForm } from '@/components/auth/RegisterForm'

function RegisterFormWrapper() {
  return <RegisterForm />
}

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-muted p-4 sm:p-6">
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
              Únete y haz tus pronósticos
            </p>
          </div>
        </div>
        <Suspense fallback={<div>Cargando...</div>}>
          <RegisterFormWrapper />
        </Suspense>
      </div>
    </main>
  )
}

