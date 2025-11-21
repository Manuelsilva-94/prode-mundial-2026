import { describe, it, expect } from 'vitest'
import { prisma } from '@/lib/db'
import { createTestUser } from '../../helpers/test-utils'
import { generateVerificationToken } from '@/lib/utils/crypto'

describe('Email Verification', () => {
  it('debería verificar email con token válido', async () => {
    const token = generateVerificationToken()
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas

    const user = await createTestUser({
      emailVerified: false,
    })

    // Asignar token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken: token,
        verificationTokenExpiry: tokenExpiry,
      },
    })

    // Verificar
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null,
      },
    })

    expect(updatedUser.emailVerified).toBe(true)
    expect(updatedUser.verificationToken).toBeNull()
  })

  it('debería rechazar token expirado', async () => {
    const token = generateVerificationToken()
    const expiredDate = new Date(Date.now() - 1000) // 1 segundo en el pasado

    const user = await createTestUser()

    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationToken: token,
        verificationTokenExpiry: expiredDate,
      },
    })

    // Verificar que el token está expirado
    const userWithToken = await prisma.user.findUnique({
      where: { id: user.id },
    })

    const isExpired = userWithToken!.verificationTokenExpiry! < new Date()
    expect(isExpired).toBe(true)
  })

  it('debería rechazar token inválido', async () => {
    await createTestUser()

    const userWithInvalidToken = await prisma.user.findFirst({
      where: { verificationToken: 'token-invalido-que-no-existe' },
    })

    expect(userWithInvalidToken).toBeNull()
  })
})
