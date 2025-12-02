import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { MatchStatus } from '@prisma/client'

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

/**
 * Crea un equipo de fútbol de prueba
 */
export async function createTestFootballTeam(
  overrides: {
    name?: string
    code?: string
    groupLetter?: string
  } = {}
) {
  const code =
    overrides.code ||
    `T${Math.random().toString(36).substring(2, 5).toUpperCase()}`

  return prisma.footballTeam.create({
    data: {
      name: overrides.name || `Test Team ${code}`,
      fullName: overrides.name || `Test Team ${code} Full Name`,
      code,
      flagUrl: 'https://flagcdn.com/w160/xx.png',
      groupLetter: overrides.groupLetter || null,
    },
  })
}

/**
 * Crea una fase de torneo de prueba
 */
export async function createTestPhase(
  overrides: {
    name?: string
    slug?: string
    pointsMultiplier?: number
  } = {}
) {
  const slug = overrides.slug || `test-phase-${Date.now()}`

  return prisma.tournamentPhase.create({
    data: {
      name: overrides.name || 'Test Phase',
      slug,
      sortOrder: 1,
      pointsMultiplier: overrides.pointsMultiplier || 1.0,
    },
  })
}

/**
 * Calcula el lockTime (15 minutos antes del partido por defecto)
 */
export function calculateLockTime(matchDate: Date, minutesBefore = 15): Date {
  return new Date(matchDate.getTime() - minutesBefore * 60 * 1000)
}

/**
 * Crea un partido de prueba
 */
export async function createTestMatch(
  overrides: {
    homeTeamId?: string
    awayTeamId?: string
    phaseId?: string
    matchDate?: Date
    lockTime?: Date
    status?: MatchStatus
    homeScore?: number
    awayScore?: number
    isLocked?: boolean
  } = {}
) {
  // Crear equipos si no se proporcionan
  const homeTeam = overrides.homeTeamId
    ? await prisma.footballTeam.findUnique({
        where: { id: overrides.homeTeamId },
      })
    : await createTestFootballTeam({ name: 'Home Team', code: 'HOM' })

  const awayTeam = overrides.awayTeamId
    ? await prisma.footballTeam.findUnique({
        where: { id: overrides.awayTeamId },
      })
    : await createTestFootballTeam({ name: 'Away Team', code: 'AWY' })

  if (!homeTeam || !awayTeam) {
    throw new Error('Error creando equipos de prueba')
  }

  // Crear fase si no se proporciona
  const phase = overrides.phaseId
    ? await prisma.tournamentPhase.findUnique({
        where: { id: overrides.phaseId },
      })
    : await createTestPhase({ slug: 'grupos' })

  if (!phase) {
    throw new Error('Error creando fase de prueba')
  }

  // Calcular fechas
  const matchDate =
    overrides.matchDate || new Date(Date.now() + 24 * 60 * 60 * 1000) // Mañana
  const lockTime = overrides.lockTime || calculateLockTime(matchDate)

  return prisma.match.create({
    data: {
      homeTeamId: homeTeam.id,
      awayTeamId: awayTeam.id,
      phaseId: phase.id,
      matchDate,
      lockTime,
      stadium: 'Test Stadium',
      city: 'Test City',
      country: 'Test Country',
      status: overrides.status || 'SCHEDULED',
      homeScore: overrides.homeScore ?? null,
      awayScore: overrides.awayScore ?? null,
      isLocked: overrides.isLocked ?? false,
    },
  })
}

/**
 * Crea una predicción de prueba
 */
export async function createTestPrediction(overrides: {
  userId: string
  matchId: string
  predictedHomeScore?: number
  predictedAwayScore?: number
}) {
  if (!overrides?.userId || !overrides?.matchId) {
    throw new Error('userId y matchId son requeridos para crear predicción')
  }

  return prisma.prediction.create({
    data: {
      userId: overrides.userId,
      matchId: overrides.matchId,
      predictedHomeScore: overrides.predictedHomeScore ?? 1,
      predictedAwayScore: overrides.predictedAwayScore ?? 0,
      pointsEarned: 0,
    },
  })
}

/**
 * Helper para obtener o crear una fase de grupos (reutilizable)
 */
let cachedGruposPhase: Awaited<ReturnType<typeof createTestPhase>> | null = null

export async function getOrCreateGruposPhase() {
  if (cachedGruposPhase) return cachedGruposPhase

  cachedGruposPhase =
    (await prisma.tournamentPhase.findUnique({
      where: { slug: 'grupos' },
    })) || (await createTestPhase({ slug: 'grupos', name: 'Fase de Grupos' }))

  return cachedGruposPhase
}
