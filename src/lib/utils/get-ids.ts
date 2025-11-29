// lib/utils/get-ids.ts
// Utilidad para obtener IDs necesarios para testing en Postman

import { prisma } from '@/lib/db'

export async function getIdsForTesting() {
  console.log('🔍 Obteniendo IDs para testing en Postman...\n')

  try {
    // Obtener equipos
    const teams = await prisma.footballTeam.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        groupLetter: true,
      },
      take: 10,
      orderBy: {
        groupLetter: 'asc',
      },
    })

    // Obtener fases
    const phases = await prisma.tournamentPhase.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        sortOrder: true,
      },
      orderBy: {
        sortOrder: 'asc',
      },
    })

    // Obtener un partido existente (si hay)
    const existingMatch = await prisma.match.findFirst({
      select: {
        id: true,
        homeTeam: {
          select: { name: true },
        },
        awayTeam: {
          select: { name: true },
        },
        matchDate: true,
        status: true,
      },
    })

    console.log('⚽ EQUIPOS DE FÚTBOL')
    console.log('════════════════════════════════════════════════════')
    teams.forEach((team) => {
      console.log(
        `${team.code.padEnd(4)} | ${team.name.padEnd(20)} | Grupo ${team.groupLetter || 'N/A'} | ${team.id}`
      )
    })

    console.log('\n📊 FASES DEL TORNEO')
    console.log('════════════════════════════════════════════════════')
    phases.forEach((phase) => {
      console.log(
        `${phase.sortOrder}. ${phase.name.padEnd(25)} | ${phase.slug.padEnd(15)} | ${phase.id}`
      )
    })

    if (existingMatch) {
      console.log('\n🏟️ PARTIDO EXISTENTE (para testing)')
      console.log('════════════════════════════════════════════════════')
      console.log(`ID: ${existingMatch.id}`)
      console.log(
        `Partido: ${existingMatch.homeTeam.name} vs ${existingMatch.awayTeam.name}`
      )
      console.log(`Fecha: ${existingMatch.matchDate.toISOString()}`)
      console.log(`Status: ${existingMatch.status}`)
    }

    // Generar ejemplo de request para Postman
    if (teams.length >= 2 && phases.length >= 1) {
      console.log('\n📝 EJEMPLO DE REQUEST PARA POSTMAN')
      console.log('════════════════════════════════════════════════════')
      console.log('POST /api/admin/matches')
      console.log('Body (JSON):')
      console.log(
        JSON.stringify(
          {
            homeTeamId: teams[0].id,
            awayTeamId: teams[1].id,
            phaseId: phases[0].id,
            matchDate: '2026-06-15T18:00:00.000Z',
            stadium: 'MetLife Stadium',
            city: 'East Rutherford',
            country: 'USA',
            groupLetter: teams[0].groupLetter || 'A',
          },
          null,
          2
        )
      )
    }

    console.log('\n✅ ¡Listo! Copia estos IDs a Postman para probar la API.\n')

    return {
      teams,
      phases,
      existingMatch,
    }
  } catch (error) {
    console.error('❌ Error obteniendo IDs:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Si se ejecuta directamente
if (require.main === module) {
  getIdsForTesting()
}
