import { beforeAll, afterAll, beforeEach } from 'vitest'

// Configurar variables de entorno antes de importar prisma
process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres:password@localhost:5432/prode_test'

// Importar prisma después de configurar env
import { prisma } from '../src/lib/db'

beforeAll(async () => {
  console.log('🔧 Configurando base de datos de testing...')
  console.log('⚠️ WARNING: Tests están DESHABILITADOS para evitar borrar datos')
  // NO LIMPIAR LA DB
}, 30000)

afterAll(async () => {
  console.log('🧹 Limpiando después de tests...')
  // NO LIMPIAR LA DB
  await prisma.$disconnect()
}, 30000)

beforeEach(async () => {
  // NO LIMPIAR ENTRE TESTS
}, 30000)

// Función comentada para evitar accidentes
/* async function cleanDatabase() {
  console.log('⚠️ cleanDatabase está deshabilitada para proteger datos de producción')
  // NO EJECUTAR
} */
