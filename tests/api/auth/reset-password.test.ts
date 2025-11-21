import { describe, it, expect } from 'vitest'
import { prisma } from '@/lib/db'
import { createTestUser } from '../../helpers/test-utils'
import { generateVerificationToken } from '@/lib/utils/crypto'
import bcrypt from 'bcryptjs'

describe('Password Reset Flow', () => {
  it('debería generar token de reset', async () => {
    const user = await createTestUser()
    const resetToken = generateVerificationToken()
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hora

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    })

    expect(updatedUser.resetToken).toBe(resetToken)
    expect(updatedUser.resetTokenExpiry).toBeDefined()
  })

  it('debería actualizar contraseña con token válido', async () => {
    const user = await createTestUser()
    const resetToken = generateVerificationToken()
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000)

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry },
    })

    // Simular reset
    const newPassword = 'NewPassword123'
    const newPasswordHash = await bcrypt.hash(newPassword, 10)

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    })

    // Verificar que la nueva contraseña funciona
    const isValid = await bcrypt.compare(newPassword, updatedUser.passwordHash)
    expect(isValid).toBe(true)
    expect(updatedUser.resetToken).toBeNull()
  })

  it('debería rechazar token expirado', async () => {
    const user = await createTestUser()
    const resetToken = generateVerificationToken()
    const expiredDate = new Date(Date.now() - 1000) // 1 segundo en el pasado

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry: expiredDate,
      },
    })

    // Verificar que el token está expirado
    const userWithToken = await prisma.user.findUnique({
      where: { id: user.id },
    })

    // Agregar validación null-safe
    expect(userWithToken).not.toBeNull()
    expect(userWithToken?.resetTokenExpiry).toBeDefined()

    if (userWithToken && userWithToken.resetTokenExpiry) {
      const isExpired = userWithToken.resetTokenExpiry < new Date()
      expect(isExpired).toBe(true)
    }
  })

  it('debería rechazar uso de token ya utilizado', async () => {
    const user = await createTestUser()
    const resetToken = generateVerificationToken()

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000),
      },
    })

    // Usar el token (primera vez)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await bcrypt.hash('NewPass123', 10),
        resetToken: null,
        resetTokenExpiry: null,
      },
    })

    // Intentar usar el mismo token (segunda vez)
    const userWithUsedToken = await prisma.user.findFirst({
      where: { resetToken },
    })

    expect(userWithUsedToken).toBeNull()
  })
})
