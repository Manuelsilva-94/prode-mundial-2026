import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

/**
 * Crea un usuario de prueba con email único
 */
export async function createTestUser(
  overrides: {
    email?: string
    name?: string
    password?: string
    role?: 'USER' | 'ADMIN'
    emailVerified?: boolean
  } = {}
) {
  const password = overrides.password || 'Test1234'
  const passwordHash = await bcrypt.hash(password, 10)

  // Generar email único si no se proporciona
  const email = overrides.email || generateUniqueEmail()

  return prisma.user.create({
    data: {
      email,
      name: overrides.name || 'Test User',
      passwordHash,
      role: overrides.role || 'USER',
      emailVerified: overrides.emailVerified ?? false,
    },
  })
}

/**
 * Crea un admin de prueba
 */
export async function createTestAdmin() {
  return createTestUser({
    email: generateUniqueEmail(), // Email único
    name: 'Test Admin',
    role: 'ADMIN',
    emailVerified: true,
  })
}

/**
 * Genera un email único para testing
 */
export function generateUniqueEmail() {
  return `test-${Date.now()}-${Math.random().toString(36).substring(7)}@test.com`
}
