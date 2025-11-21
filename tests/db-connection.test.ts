import { describe, it, expect } from 'vitest'
import { prisma } from '../src/lib/db'

describe('Database Connection', () => {
  it('debería conectar a la base de datos', async () => {
    const result = await prisma.$queryRaw`SELECT 1 as result`
    expect(result).toBeDefined()
  }, 30000)
})
