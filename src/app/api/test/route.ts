import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    // Contar registros
    const [
      usersCount,
      teamsCount,
      footballTeamsCount,
      phasesCount,
      matchesCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.team.count(),
      prisma.footballTeam.count(),
      prisma.tournamentPhase.count(),
      prisma.match.count(),
    ])

    // Obtener algunas fases
    const phases = await prisma.tournamentPhase.findMany({
      orderBy: { sortOrder: 'asc' },
    })

    // Obtener selecciones
    const footballTeams = await prisma.footballTeam.findMany({
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({
      success: true,
      stats: {
        users: usersCount,
        teams: teamsCount,
        footballTeams: footballTeamsCount,
        phases: phasesCount,
        matches: matchesCount,
      },
      data: {
        phases,
        footballTeams,
      },
    })
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Database error', details: error },
      { status: 500 }
    )
  }
}
