'use client'

import { Button } from '@/components/ui/button'
import { signOut } from 'next-auth/react'
import { LogOut } from 'lucide-react' // Usamos un ícono para mejor UX

/**
 * Componente que maneja la lógica de cierre de sesión.
 * Llama a la API de NextAuth para invalidar la sesión y redirigir al usuario.
 */
export function LogoutButton() {
  const handleLogout = async () => {
    // Llama a la función signOut.
    // NextAuth.js se encarga de:
    // 1. Invalidar el token de sesión (JWT) en el navegador.
    // 2. Opcionalmente, eliminar la sesión de la base de datos (si usas adaptador).
    // 3. Redirigir al usuario a la página de inicio de sesión (`/login` en tu caso,
    //    porque así lo definiste en `route.ts` con `pages: { signIn: '/login' }`).
    await signOut({
      redirect: true, // Habilitamos la redirección automática a la página de login
      callbackUrl: '/login', // URL a la que redirigir después del logout (opcional, por defecto usa signIn)
    })
  }

  return (
    <Button
      variant="ghost" // Estilo de botón discreto
      onClick={handleLogout}
      className="flex items-center space-x-2"
    >
      <LogOut className="h-4 w-4" />
      <span>Cerrar Sesión</span>
    </Button>
  )
}
