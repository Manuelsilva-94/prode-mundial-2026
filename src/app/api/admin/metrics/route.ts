import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { startOfDay, subDays } from 'date-fns'

/**
 * GET /api/admin/metrics
 * Obtiene métricas del dashboard de administración
 * Solo accesible por administradores
 */
export async function GET() {
  try {
    // Verificar que sea admin
    await requireAdmin()

    const today = startOfDay(new Date())
    const lastWeek = subDays(today, 7)

    // Ejecutar consultas de forma secuencial para evitar agotar el connection pool
    // Consultas básicas de conteo
    const totalUsers = await prisma.user.count()
    const totalPredictions = await prisma.prediction.count()
    const totalMatches = await prisma.match.count()
    const totalTeams = await prisma.team.count()

    // Conteos de partidos por estado
    const pendingMatches = await prisma.match.count({
      where: {
        status: 'SCHEDULED',
        matchDate: { lt: new Date() },
      },
    })
    const liveMatches = await prisma.match.count({
      where: { status: 'LIVE' },
    })
    const finishedMatches = await prisma.match.count({
      where: { status: 'FINISHED' },
    })

    // Actividad reciente
    const usersToday = await prisma.user.count({
      where: { createdAt: { gte: today } },
    })
    const usersLastWeek = await prisma.user.count({
      where: { createdAt: { gte: lastWeek } },
    })
    const predictionsToday = await prisma.prediction.count({
      where: { createdAt: { gte: today } },
    })
    const predictionsLastWeek = await prisma.prediction.count({
      where: { createdAt: { gte: lastWeek } },
    })

    // Datos recientes
    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    })

    const recentPredictions = await prisma.prediction.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { name: true },
        },
        match: {
          select: {
            homeTeam: { select: { code: true } },
            awayTeam: { select: { code: true } },
          },
        },
      },
    })

    // Calcular porcentajes y tendencias
    const userGrowthRate = totalUsers > 0 
      ? ((usersLastWeek / totalUsers) * 100).toFixed(1)
      : '0'

    const predictionRate = totalUsers > 0
      ? (totalPredictions / totalUsers).toFixed(1)
      : '0'

    return NextResponse.json({
      overview: {
        totalUsers,
        totalPredictions,
        totalTeams,
        totalMatches,
      },
      matches: {
        pending: pendingMatches,
        live: liveMatches,
        finished: finishedMatches,
        scheduled: totalMatches - finishedMatches - liveMatches,
      },
      activity: {
        usersToday,
        usersLastWeek,
        predictionsToday,
        predictionsLastWeek,
        userGrowthRate,
        predictionRate,
      },
      recent: {
        users: recentUsers,
        predictions: recentPredictions.map((p) => ({
          id: p.id,
          userName: p.user.name,
          match: `${p.match.homeTeam.code} vs ${p.match.awayTeam.code}`,
          prediction: `${p.predictedHomeScore}-${p.predictedAwayScore}`,
          createdAt: p.createdAt,
        })),
      },
    })
  } catch (error) {
    console.error('Admin metrics error:', error)
    
    // Error de autenticación/autorización
    if (error instanceof Error && 'status' in error) {
      return NextResponse.json(
        { error: error.message },
        { status: (error as Error & { status: number }).status }
      )
    }
    
    // Error genérico con más detalles en desarrollo
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json(
      { 
        error: 'Error al obtener métricas',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined 
      },
      { status: 500 }
    )
  }
}

