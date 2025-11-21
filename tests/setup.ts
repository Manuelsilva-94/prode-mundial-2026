import { beforeAll, afterAll, beforeEach } from 'vitest'

// Configurar variables de entorno antes de importar prisma
process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres:password@localhost:5432/prode_test'

// Importar prisma después de configurar env
import { prisma } from '../src/lib/db'

beforeAll(async () => {
  console.log('🔧 Configurando base de datos de testing...')

  // Comentamos las migraciones porque ya están aplicadas
  // Si necesitás aplicarlas, descomentá y ejecutá una vez
  // console.log('📦 Aplicando migraciones...')
  // await execAsync('npx prisma migrate deploy')

  // Solo limpiar base de datos
  await cleanDatabase()
  console.log('✅ Base de datos lista')
}, 30000)

afterAll(async () => {
  console.log('🧹 Limpiando después de tests...')
  await cleanDatabase()
  await prisma.$disconnect()
}, 30000)

beforeEach(async () => {
  // Limpiar entre cada test para independencia
  await cleanDatabase()
}, 30000)

async function cleanDatabase() {
  try {
    // Deshabilitar triggers y constraints temporalmente para limpieza rápida
    await prisma.$executeRawUnsafe('SET session_replication_role = replica;')

    // Orden de limpieza respetando foreign keys
    await prisma.auditLog.deleteMany()
    await prisma.notification.deleteMany()
    await prisma.prediction.deleteMany()
    await prisma.leaderboardCache.deleteMany()
    await prisma.teamLeaderboardCache.deleteMany()
    await prisma.match.deleteMany()
    await prisma.teamMember.deleteMany()
    await prisma.team.deleteMany()
    await prisma.user.deleteMany()
    await prisma.footballTeam.deleteMany()
    await prisma.scoringRule.deleteMany()
    await prisma.tournamentPhase.deleteMany()

    // Re-habilitar triggers y constraints
    await prisma.$executeRawUnsafe('SET session_replication_role = DEFAULT;')
  } catch (error) {
    console.error('Error limpiando base de datos:', error)
    throw error
  }
}
