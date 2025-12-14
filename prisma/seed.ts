// prisma/seed.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { calculatePointsForMatch } from '../src/lib/scoring/match-processor'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed...')

  // 🧹 IDEMPOTENCIA: Limpiar en orden inverso (respetando FK)
  console.log('🧹 Limpiando datos existentes...')
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

  // 1️⃣ FASES DEL TORNEO (datos estables)
  console.log('📊 Creando fases del torneo...')
  const phases = await Promise.all([
    prisma.tournamentPhase.create({
      data: {
        name: 'Fase de Grupos',
        slug: 'grupos',
        sortOrder: 1,
        pointsMultiplier: 1.0,
      },
    }),
    prisma.tournamentPhase.create({
      data: {
        name: 'Dieciseisavos de Final',
        slug: 'dieciseisavos',
        sortOrder: 2,
        pointsMultiplier: 1.0,
      },
    }),
    prisma.tournamentPhase.create({
      data: {
        name: 'Octavos de Final',
        slug: 'octavos',
        sortOrder: 3,
        pointsMultiplier: 1.0,
      },
    }),
    prisma.tournamentPhase.create({
      data: {
        name: 'Cuartos de Final',
        slug: 'cuartos',
        sortOrder: 4,
        pointsMultiplier: 1.0,
      },
    }),
    prisma.tournamentPhase.create({
      data: {
        name: 'Semifinales',
        slug: 'semifinales',
        sortOrder: 5,
        pointsMultiplier: 1.0,
      },
    }),
    prisma.tournamentPhase.create({
      data: {
        name: 'Tercer Lugar',
        slug: 'tercer-lugar',
        sortOrder: 6,
        pointsMultiplier: 1.0,
      },
    }),
    prisma.tournamentPhase.create({
      data: {
        name: 'Final',
        slug: 'final',
        sortOrder: 7,
        pointsMultiplier: 1.0,
      },
    }),
  ])
  console.log(`✅ ${phases.length} fases creadas`)

  // 2️⃣ REGLAS DE PUNTUACIÓN (datos estables)
  // Nota: Estas reglas se guardan en la DB pero el cálculo real se hace en src/lib/scoring/calculator.ts
  // Se mantienen aquí para referencia y posibles consultas históricas
  console.log('🎯 Creando reglas de puntuación...')
  const rules = await Promise.all([
    prisma.scoringRule.create({
      data: {
        ruleType: 'EXACT_SCORE',
        points: 12,
        description: 'Acertar el resultado exacto (ej: 2-1 predicho, 2-1 real)',
        isActive: true,
      },
    }),
    prisma.scoringRule.create({
      data: {
        ruleType: 'CORRECT_WINNER_OR_DRAW',
        points: 5,
        description: 'Acertar ganador o empate (sin resultado exacto)',
        isActive: true,
      },
    }),
    prisma.scoringRule.create({
      data: {
        ruleType: 'CORRECT_WINNER_PLUS_ONE_TEAM_SCORE',
        points: 7,
        description: 'Acertar ganador + goles de un equipo',
        isActive: true,
      },
    }),
    prisma.scoringRule.create({
      data: {
        ruleType: 'CORRECT_ONE_TEAM_SCORE',
        points: 2,
        description: 'Acertar goles de un equipo (sin acertar ganador)',
        isActive: true,
      },
    }),
  ])
  console.log(`✅ ${rules.length} reglas creadas`)

  // 3️⃣ EQUIPOS DE FÚTBOL (solo ejemplos para desarrollo)
  console.log('⚽ Creando equipos de prueba...')
  const teams = await Promise.all([
    // Grupo A
    prisma.footballTeam.create({
      data: {
        name: 'Argentina',
        fullName: 'Selección Argentina de Fútbol',
        code: 'ARG',
        flagUrl: 'https://flagcdn.com/w160/ar.png',
        groupLetter: 'A',
      },
    }),
    prisma.footballTeam.create({
      data: {
        name: 'Canadá',
        fullName: 'Canada National Soccer Team',
        code: 'CAN',
        flagUrl: 'https://flagcdn.com/w160/ca.png',
        groupLetter: 'A',
      },
    }),
    // Grupo B
    prisma.footballTeam.create({
      data: {
        name: 'Brasil',
        fullName: 'Seleção Brasileira de Futebol',
        code: 'BRA',
        flagUrl: 'https://flagcdn.com/w160/br.png',
        groupLetter: 'B',
      },
    }),
    prisma.footballTeam.create({
      data: {
        name: 'México',
        fullName: 'Selección Nacional de México',
        code: 'MEX',
        flagUrl: 'https://flagcdn.com/w160/mx.png',
        groupLetter: 'B',
      },
    }),
    // Grupo C
    prisma.footballTeam.create({
      data: {
        name: 'Estados Unidos',
        fullName: 'United States Soccer Team',
        code: 'USA',
        flagUrl: 'https://flagcdn.com/w160/us.png',
        groupLetter: 'C',
      },
    }),
    prisma.footballTeam.create({
      data: {
        name: 'Uruguay',
        fullName: 'Selección Uruguaya de Fútbol',
        code: 'URU',
        flagUrl: 'https://flagcdn.com/w160/uy.png',
        groupLetter: 'C',
      },
    }),
    // Grupo D
    prisma.footballTeam.create({
      data: {
        name: 'España',
        fullName: 'Selección Española de Fútbol',
        code: 'ESP',
        flagUrl: 'https://flagcdn.com/w160/es.png',
        groupLetter: 'D',
      },
    }),
    prisma.footballTeam.create({
      data: {
        name: 'Francia',
        fullName: 'Équipe de France de Football',
        code: 'FRA',
        flagUrl: 'https://flagcdn.com/w160/fr.png',
        groupLetter: 'D',
      },
    }),
  ])
  console.log(`✅ ${teams.length} equipos creados`)

  // 4️⃣ PARTIDOS DE PRUEBA (solo 5-6 para testing)
  console.log('🏟️ Creando partidos de prueba...')
  const matches = await Promise.all([
    prisma.match.create({
      data: {
        homeTeamId: teams[0].id, // Argentina
        awayTeamId: teams[1].id, // Canadá
        matchDate: new Date('2026-06-11T18:00:00Z'),
        stadium: 'MetLife Stadium',
        city: 'East Rutherford',
        country: 'USA',
        phaseId: phases[0].id,
        groupLetter: 'A',
        lockTime: new Date('2026-06-11T17:00:00Z'),
        isLocked: false,
        status: 'SCHEDULED',
      },
    }),
    prisma.match.create({
      data: {
        homeTeamId: teams[2].id, // Brasil
        awayTeamId: teams[3].id, // México
        matchDate: new Date('2026-06-12T21:00:00Z'),
        stadium: 'SoFi Stadium',
        city: 'Los Angeles',
        country: 'USA',
        phaseId: phases[0].id,
        groupLetter: 'B',
        lockTime: new Date('2026-06-12T20:00:00Z'),
        isLocked: false,
        status: 'SCHEDULED',
      },
    }),
    // Partido con resultado (para testing de cálculo de puntos)
    prisma.match.create({
      data: {
        homeTeamId: teams[4].id, // USA
        awayTeamId: teams[5].id, // Uruguay
        matchDate: new Date('2025-12-01T18:00:00Z'), // Pasado
        stadium: 'Rose Bowl',
        city: 'Pasadena',
        country: 'USA',
        phaseId: phases[0].id,
        groupLetter: 'C',
        homeScore: 2,
        awayScore: 1,
        lockTime: new Date('2025-12-01T17:00:00Z'),
        isLocked: true,
        status: 'FINISHED',
      },
    }),
  ])
  console.log(`✅ ${matches.length} partidos creados`)

  // 5️⃣ USUARIO ADMIN
  console.log('👤 Creando usuario admin...')
  const adminPassword = 'Admin123!' // Documentado
  const adminHash = await bcrypt.hash(adminPassword, 10)

  const admin = await prisma.user.create({
    data: {
      email: 'admin@prode2026.com',
      name: 'Administrador',
      passwordHash: adminHash,
      role: 'ADMIN',
      emailVerified: true,
    },
  })
  console.log(`✅ Admin creado: ${admin.email}`)
  console.log(`   Password: ${adminPassword}`)

  // 6️⃣ USUARIOS DE PRUEBA
  console.log('👥 Creando usuarios de prueba...')
  const testPassword = 'Test123!'
  const testHash = await bcrypt.hash(testPassword, 10)

  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'juan@test.com',
        name: 'Juan Pérez',
        passwordHash: testHash,
        role: 'USER',
        emailVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'maria@test.com',
        name: 'María García',
        passwordHash: testHash,
        role: 'USER',
        emailVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        email: 'carlos@test.com',
        name: 'Carlos López',
        passwordHash: testHash,
        role: 'USER',
        emailVerified: false,
      },
    }),
  ])
  console.log(`✅ ${users.length} usuarios de prueba creados`)
  console.log(`   Password para todos: ${testPassword}`)

  // 7️⃣ PREDICCIONES DE PRUEBA
  console.log('🔮 Creando predicciones de prueba...')
  const predictions = await Promise.all([
    // Juan predice Argentina gana 2-0
    prisma.prediction.create({
      data: {
        userId: users[0].id,
        matchId: matches[0].id,
        predictedHomeScore: 2,
        predictedAwayScore: 0,
      },
    }),
    // María predice empate 1-1
    prisma.prediction.create({
      data: {
        userId: users[1].id,
        matchId: matches[0].id,
        predictedHomeScore: 1,
        predictedAwayScore: 1,
      },
    }),
    // Juan predice USA 2-1 Uruguay (acertó exacto en el partido terminado)
    prisma.prediction.create({
      data: {
        userId: users[0].id,
        matchId: matches[2].id,
        predictedHomeScore: 2,
        predictedAwayScore: 1,
        // Los puntos se calcularán usando calculatePointsForMatch
      },
    }),
  ])
  console.log(`✅ ${predictions.length} predicciones creadas`)

  // Calcular puntos para el partido finalizado usando el sistema de scoring
  if (matches[2].status === 'FINISHED' && matches[2].homeScore !== null && matches[2].awayScore !== null) {
    console.log('🎯 Calculando puntos para el partido finalizado...')
    await calculatePointsForMatch(matches[2].id)
  }

  // 8️⃣ EQUIPOS CORPORATIVOS DE PRUEBA
  console.log('🏢 Creando equipos corporativos...')
  const corporateTeams = await Promise.all([
    prisma.team.create({
      data: {
        name: 'Equipo Tech',
        description: 'Desarrolladores de la empresa',
        inviteCode: 'TECH26',
        creatorId: admin.id,
      },
    }),
    prisma.team.create({
      data: {
        name: 'Equipo Marketing',
        description: 'Equipo de marketing y ventas',
        inviteCode: 'MKT026',
        creatorId: users[0].id,
      },
    }),
  ])
  console.log(`✅ ${corporateTeams.length} equipos corporativos creados`)

  // Agregar miembros a los equipos
  await Promise.all([
    prisma.teamMember.create({
      data: {
        userId: users[0].id,
        teamId: corporateTeams[0].id,
        role: 'ADMIN',
      },
    }),
    prisma.teamMember.create({
      data: {
        userId: users[1].id,
        teamId: corporateTeams[0].id,
        role: 'MEMBER',
      },
    }),
    prisma.teamMember.create({
      data: {
        userId: users[2].id,
        teamId: corporateTeams[1].id,
        role: 'MEMBER',
      },
    }),
  ])
  console.log('✅ Miembros agregados a equipos')

  // 9️⃣ VERIFICACIÓN FINAL
  console.log('\n📊 Verificando datos insertados...')
  const counts = {
    phases: await prisma.tournamentPhase.count(),
    rules: await prisma.scoringRule.count(),
    teams: await prisma.footballTeam.count(),
    matches: await prisma.match.count(),
    users: await prisma.user.count(),
    predictions: await prisma.prediction.count(),
    corporateTeams: await prisma.team.count(),
    teamMembers: await prisma.teamMember.count(),
  }

  console.log('\n✅ SEED COMPLETADO')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`📊 Fases del torneo: ${counts.phases}`)
  console.log(`🎯 Reglas de puntuación: ${counts.rules}`)
  console.log(`⚽ Equipos de fútbol: ${counts.teams}`)
  console.log(`🏟️ Partidos: ${counts.matches}`)
  console.log(`👥 Usuarios: ${counts.users}`)
  console.log(`🔮 Predicciones: ${counts.predictions}`)
  console.log(`🏢 Equipos corporativos: ${counts.corporateTeams}`)
  console.log(`👤 Miembros de equipos: ${counts.teamMembers}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('\n📝 CREDENCIALES DE ACCESO:')
  console.log(`👨‍💼 Admin: admin@prode2026.com / ${adminPassword}`)
  console.log(`👤 Test: juan@test.com / ${testPassword}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
