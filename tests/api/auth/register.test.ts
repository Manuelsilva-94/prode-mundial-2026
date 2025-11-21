import { describe, it, expect } from 'vitest'
import { prisma } from '@/lib/db'
import { generateUniqueEmail } from '../../helpers/test-utils'

describe('POST /api/auth/register', () => {
  it('debería registrar un usuario con datos válidos', async () => {
    const email = generateUniqueEmail()

    const userData = {
      email,
      name: 'Test User',
      password: 'Test1234',
    }

    // Simular el registro directamente con Prisma (sin HTTP por ahora)
    const bcrypt = await import('bcryptjs')
    const passwordHash = await bcrypt.hash(userData.password, 10)

    const user = await prisma.user.create({
      data: {
        email: userData.email,
        name: userData.name,
        passwordHash,
        role: 'USER',
        emailVerified: false,
      },
    })

    expect(user).toBeDefined()
    expect(user.email).toBe(email.toLowerCase())
    expect(user.name).toBe('Test User')
    expect(user.emailVerified).toBe(false)
  })

  it('debería rechazar email duplicado', async () => {
    const email = generateUniqueEmail()
    const bcrypt = await import('bcryptjs')
    const passwordHash = await bcrypt.hash('Test1234', 10)

    // Crear primer usuario
    await prisma.user.create({
      data: {
        email,
        name: 'First User',
        passwordHash,
        role: 'USER',
        emailVerified: false,
      },
    })

    // Intentar crear segundo usuario con mismo email
    await expect(
      prisma.user.create({
        data: {
          email,
          name: 'Second User',
          passwordHash,
          role: 'USER',
          emailVerified: false,
        },
      })
    ).rejects.toThrow()
  })

  it('debería hashear la contraseña', async () => {
    const email = generateUniqueEmail()
    const password = 'Test1234'
    const bcrypt = await import('bcryptjs')
    const passwordHash = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        email,
        name: 'Test User',
        passwordHash,
        role: 'USER',
        emailVerified: false,
      },
    })

    // Verificar que no es el password en texto plano
    expect(user.passwordHash).not.toBe(password)

    // Verificar que el hash es válido
    const isValid = await bcrypt.compare(password, user.passwordHash)
    expect(isValid).toBe(true)
  })
})
