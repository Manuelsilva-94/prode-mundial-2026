'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

/**
 * Configuración optimizada de React Query
 * - staleTime: Tiempo que los datos se consideran frescos (no se refetcha)
 * - gcTime: Tiempo que los datos inactivos permanecen en caché
 * - refetchOnWindowFocus: Deshabilitado para evitar refetch innecesarios
 * - retry: Reintentos limitados para mejor UX
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Datos frescos por 2 minutos (no refetch automático)
            staleTime: 2 * 60 * 1000,
            // Mantener en caché por 10 minutos después de no usarse
            gcTime: 10 * 60 * 1000,
            // No refetch al volver a la ventana
            refetchOnWindowFocus: false,
            // No refetch al reconectar
            refetchOnReconnect: false,
            // Máximo 2 reintentos con backoff exponencial
            retry: 2,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
          },
          mutations: {
            // Reintentar mutaciones fallidas una vez
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}
