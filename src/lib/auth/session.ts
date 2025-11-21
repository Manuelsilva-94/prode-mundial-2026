import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/db'

/**
 * Obtiene la sesión actual del servidor
 */
export async function getSession() {
  return await getServerSession(authOptions)
}

/**
 * Obtiene el usuario actual completo desde la base de datos
 * @param includeStats - Si es true, incluye estadísticas del usuario
 */
export async function getCurrentUser(includeStats = false) {
  const session = await getSession()

  if (!session?.user?.id) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      role: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
      ...(includeStats && {
        _count: {
          select: {
            predictions: true,
            teamMemberships: true,
          },
        },
      }),
    },
  })

  return user
}

/**
 * Verifica que el usuario esté autenticado
 * @throws Error si no está autenticado con código HTTP
 */
export async function requireAuth() {
  const session = await getSession()

  if (!session?.user) {
    const error = new Error('No autenticado') as Error & { status: number }
    error.status = 401
    throw error
  }

  return session
}

/**
 * Verifica que el usuario esté autenticado y retorna el usuario completo
 * @throws Error si no está autenticado
 */
export async function requireAuthUser() {
  await requireAuth()
  const user = await getCurrentUser()

  if (!user) {
    const error = new Error('Usuario no encontrado') as Error & {
      status: number
    }
    error.status = 401
    throw error
  }

  return user
}

/**
 * Verifica que el usuario sea ADMIN
 * @throws Error si no es admin con código HTTP
 */
export async function requireAdmin() {
  const session = await requireAuth()

  if (session.user.role !== 'ADMIN') {
    const error = new Error(
      'No autorizado - Se requiere rol de administrador'
    ) as Error & {
      status: number
    }
    error.status = 403
    throw error
  }

  return session
}

/**
 * Verifica que el usuario sea ADMIN y retorna el usuario completo
 * @throws Error si no es admin
 */
export async function requireAdminUser() {
  await requireAdmin()
  const user = await getCurrentUser()

  if (!user) {
    const error = new Error('Usuario no encontrado') as Error & {
      status: number
    }
    error.status = 401
    throw error
  }

  return user
}

/**
 * Verifica si el usuario actual es el dueño del recurso
 * @param resourceOwnerId - ID del dueño del recurso
 */
export async function isResourceOwner(
  resourceOwnerId: string
): Promise<boolean> {
  const session = await getSession()

  if (!session?.user?.id) {
    return false
  }

  return session.user.id === resourceOwnerId
}

/**
 * Verifica que el usuario sea el dueño del recurso O un admin
 * @param resourceOwnerId - ID del dueño del recurso
 * @throws Error si no es dueño ni admin
 */
export async function requireOwnerOrAdmin(resourceOwnerId: string) {
  const session = await requireAuth()

  const isOwner = session.user.id === resourceOwnerId
  const isAdmin = session.user.role === 'ADMIN'

  if (!isOwner && !isAdmin) {
    const error = new Error(
      'No autorizado - No tienes permiso para este recurso'
    ) as Error & {
      status: number
    }
    error.status = 403
    throw error
  }

  return session
}
