import { describe, it, expect } from 'vitest'
import {
  registerSchema,
  resetPasswordSchema,
  forgotPasswordSchema,
} from '@/lib/validations/auth'

describe('Auth Validations', () => {
  describe('registerSchema', () => {
    it('debería validar datos correctos', () => {
      const validData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'Test1234',
        confirmPassword: 'Test1234',
      }

      const result = registerSchema.parse(validData)
      expect(result).toEqual({
        email: 'test@example.com',
        name: 'Test User',
        password: 'Test1234',
        confirmPassword: 'Test1234',
      })
    })

    it('debería rechazar cuando las contraseñas no coinciden', () => {
      const invalidData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'Test1234',
        confirmPassword: 'Test5678', // Diferente
      }

      expect(() => registerSchema.parse(invalidData)).toThrow(
        'Las contraseñas no coinciden'
      )
    })

    it('debería rechazar email inválido', () => {
      const invalidData = {
        email: 'not-an-email',
        name: 'Test User',
        password: 'Test1234',
        confirmPassword: 'Test1234',
      }

      expect(() => registerSchema.parse(invalidData)).toThrow()
    })

    it('debería rechazar password sin mayúscula', () => {
      const invalidData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'test1234', // Sin mayúscula
        confirmPassword: 'test1234',
      }

      expect(() => registerSchema.parse(invalidData)).toThrow(
        'La contraseña debe contener al menos una mayúscula'
      )
    })

    it('debería rechazar password sin número', () => {
      const invalidData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'TestTest', // Sin número
        confirmPassword: 'TestTest',
      }

      expect(() => registerSchema.parse(invalidData)).toThrow(
        'La contraseña debe contener al menos un número'
      )
    })

    it('debería rechazar password corto', () => {
      const invalidData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'Test1', // Menos de 8 caracteres
        confirmPassword: 'Test1',
      }

      expect(() => registerSchema.parse(invalidData)).toThrow(
        'La contraseña debe tener al menos 8 caracteres'
      )
    })

    it('debería rechazar nombre muy corto', () => {
      const invalidData = {
        email: 'test@example.com',
        name: 'A', // 1 caracter
        password: 'Test1234',
        confirmPassword: 'Test1234',
      }

      expect(() => registerSchema.parse(invalidData)).toThrow()
    })

    it('debería trimear espacios en email y nombre', () => {
      const dataWithSpaces = {
        email: '  test@example.com  ',
        name: '  Test User  ',
        password: 'Test1234',
        confirmPassword: 'Test1234',
      }

      const result = registerSchema.parse(dataWithSpaces)
      expect(result.email).toBe('test@example.com')
      expect(result.name).toBe('Test User')
    })

    it('debería convertir email a minúsculas', () => {
      const dataWithUppercase = {
        email: 'TEST@EXAMPLE.COM',
        name: 'Test User',
        password: 'Test1234',
        confirmPassword: 'Test1234',
      }

      const result = registerSchema.parse(dataWithUppercase)
      expect(result.email).toBe('test@example.com')
    })
  })

  describe('forgotPasswordSchema', () => {
    it('debería validar email válido', () => {
      const result = forgotPasswordSchema.parse({ email: 'test@example.com' })
      expect(result.email).toBe('test@example.com')
    })

    it('debería rechazar email inválido', () => {
      expect(() => forgotPasswordSchema.parse({ email: 'invalid' })).toThrow()
    })
  })

  describe('resetPasswordSchema', () => {
    it('debería validar datos correctos', () => {
      const validData = {
        token: 'valid-token-123',
        password: 'NewPass123',
      }

      const result = resetPasswordSchema.parse(validData)
      expect(result).toEqual(validData)
    })

    it('debería rechazar token vacío', () => {
      expect(() =>
        resetPasswordSchema.parse({ token: '', password: 'NewPass123' })
      ).toThrow()
    })

    it('debería rechazar password débil', () => {
      expect(() =>
        resetPasswordSchema.parse({ token: 'token', password: 'weak' })
      ).toThrow()
    })
  })
})
