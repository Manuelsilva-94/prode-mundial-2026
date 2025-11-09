import { withAuth, NextRequestWithAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  // La función 'middleware' se ejecuta si el usuario está autenticado
  function middleware(request: NextRequestWithAuth) {
    const token = request.nextauth.token
    const pathname = request.nextUrl.pathname

    // --- 1. Lógica de Protección de Rol para /admin ---
    if (pathname.startsWith('/admin')) {
      if (token?.role !== 'ADMIN') {
        // Redirigir si no es admin. Se redirige a la home para no revelar rutas.
        return NextResponse.redirect(new URL('/home', request.url))
      }
    }

    // --- 2. Lógica de Redirección si se intenta acceder a /login estando ya autenticado ---
    if (pathname === '/login' && token) {
      // Si el usuario está logueado, lo enviamos a /home
      return NextResponse.redirect(new URL('/home', request.url))
    }

    // Si la ruta es válida y el rol es correcto, continuar
    return NextResponse.next()
  },
  {
    // Esta configuración define las rutas que deben estar protegidas
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname

        // Rutas que requieren autenticación (todas excepto login y la raíz)
        const protectedRoutes = ['/home', '/profile', '/admin']

        // Si la ruta es protegida, se requiere un token
        if (protectedRoutes.some((route) => pathname.startsWith(route))) {
          return !!token // Devuelve true si hay token
        }

        // Si la ruta no está explícitamente protegida, permitir acceso (ej: /login, /public)
        return true
      },
    },
    // Página a la que se redirige si el usuario no está autenticado y se accede a una ruta protegida
    pages: {
      signIn: '/login',
    },
  }
)

// Definir las rutas que serán manejadas por el middleware
// src/middleware.ts (en su nueva ubicación)

export const config = {
  matcher: [
    '/home', // Captura la ruta exacta /home
    '/home/:path*', // Captura sub-rutas como /home/partidos
    '/admin', // Captura la ruta exacta /admin
    '/admin/:path*',
    '/profile', // Si la tienes
    '/profile/:path*',
    '/login',
  ],
}
