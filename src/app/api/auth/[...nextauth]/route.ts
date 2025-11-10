// Usamos PrismaClient para interactuar con la DB
import { PrismaClient } from '@prisma/client'
// Importamos las utilidades para el adaptador y el hashing
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import * as bcrypt from 'bcryptjs'

// Importamos NextAuth y el Provider de Credenciales, junto con los tipos
import NextAuth, { AuthOptions, DefaultSession } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

// Inicializamos PrismaClient
const prisma = new PrismaClient()

// --------------------------------------------------------------
// EXTENSIÓN DE TIPOS PARA NEXTAUTH (IMPORTANTE PARA EL ROL)
// --------------------------------------------------------------

// 1. Extender el tipo 'Session' para incluir el rol y el ID
declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string
      role: 'USER' | 'ADMIN' // Define aquí los roles posibles según tu modelo User
    } & DefaultSession['user']
  }

  // 2. Extender el tipo 'User' para incluir el rol que se devuelve en authorize
  interface User {
    role: 'USER' | 'ADMIN'
  }
}

// 3. Extender el tipo 'JWT' para incluir el rol
declare module 'next-auth/jwt' {
  interface JWT {
    role: 'USER' | 'ADMIN'
    id: string
  }
}

// --------------------------------------------------------------
// CONFIGURACIÓN DE NEXTAUTH
// --------------------------------------------------------------

export const authOptions: AuthOptions = {
  // 1. ADAPTADOR DE BASE DE DATOS: Usa Prisma para manejar Usuarios y Sesiones
  adapter: PrismaAdapter(prisma),

  // 2. PROVIDERS: Definimos el proveedor de Email/Password (Credenciales)
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      // Definición de los campos esperados en el formulario de login
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },

      // Lógica de autorización cuando el usuario intenta iniciar sesión
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null // Credenciales incompletas
        }

        // Buscar el usuario en la base de datos
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        // Si el usuario no existe o no tiene un hash de password
        if (!user || !user.passwordHash) {
          return null
        }

        // Comparar la contraseña proporcionada con el hash almacenado
        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        )

        if (isValid) {
          // Si la contraseña es válida, devolvemos el objeto usuario.
          // Nota: El modelo de Prisma debe tener el campo 'role'
          return {
            id: user.id, // ID es obligatorio
            name: user.name,
            email: user.email,
            role: user.role as 'USER' | 'ADMIN', // Casteamos el rol para asegurar el tipado
          }
        }

        // Si no es válido
        return null
      },
    }),
  ],

  // 3. ESTRATEGIA DE SESIÓN: Usamos JWT para manejar las sesiones
  session: {
    strategy: 'jwt',
    // maxAge: 30 * 24 * 60 * 60, // 30 días, si quieres extender la duración de la sesión
  },

  // 4. PÁGINAS CUSTOM: Redirecciones para login, error y signout
  pages: {
    signIn: '/login',
    // error: '/auth/error', // Descomentar si quieres una página de error custom
  },

  // 5. CALLBACKS: Lógica para manejar el JWT y la Sesión
  callbacks: {
    // JWT Callback: Se ejecuta al iniciar sesión y cuando la sesión se comprueba
    async jwt({ token, user }) {
      // user solo está disponible en el primer inicio de sesión
      if (user) {
        token.id = user.id
        token.role = user.role // Añadimos el rol al token
      }
      return token
    },

    // Session Callback: Se ejecuta cada vez que un cliente pide la sesión
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.role = token.role // Añadimos el rol al objeto sesión
      }
      return session
    },
  },

  // 6. CLAVE SECRETA (tomada del .env)
  secret: process.env.NEXTAUTH_SECRET,
}

// 7. EXPORTAR HANDLERS (Next.js App Router)
const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
