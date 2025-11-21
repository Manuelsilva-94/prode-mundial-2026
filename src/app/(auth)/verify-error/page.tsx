// app/(auth)/verify-error/page.tsx

import { Suspense } from 'react'
import VerifyErrorContent from '@/components/auth/VerifyErrorContent'

// Componente de fallback simple mientras se carga el contenido del cliente
const LoadingFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-red-600 to-orange-500 px-4">
    <div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-2xl">
      <p className="text-xl font-semibold text-gray-700">
        Cargando información de error...
      </p>
      {/* Opcional: puedes agregar un spinner o un esqueleto más elaborado */}
    </div>
  </div>
)

export default function VerifyErrorPage() {
  // El Server Component envuelve el Client Component en Suspense.
  // Esto le dice a Next.js que no intente prerenderizar el contenido interno
  // y que espere a que el cliente ejecute VerifyErrorContent de forma segura.
  return (
    <Suspense fallback={<LoadingFallback />}>
      <VerifyErrorContent />
    </Suspense>
  )
}
