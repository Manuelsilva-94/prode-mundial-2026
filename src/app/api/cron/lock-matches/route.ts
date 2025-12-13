import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { handleApiError } from '@/lib/api/error-handler'

/**
 * POST /api/cron/lock-matches
 *
 * Cron job ejecutado cada 5 minutos por Vercel Cron Jobs
 *
 * Bloquea automáticamente partidos donde:
 * - lockTime <= now()
 * - isLocked = false
 *
 * Seguridad:
 * - Requiere CRON_SECRET en header 'authorization'
 * - Solo Vercel puede ejecutar este endpoint
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now()
  let lockedCount = 0
  let errorCount = 0
  const errors: string[] = []

  try {
    // ============================================
    // 1. VALIDACIÓN DE SEGURIDAD
    // ============================================
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
      console.error(
        '❌ CRON_SECRET no está configurado en variables de entorno'
      )
      return NextResponse.json(
        {
          error: 'Configuración incorrecta',
          message: 'CRON_SECRET no configurado',
        },
        { status: 500 }
      )
    }

    // Verificar que el secret coincida
    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      console.warn('⚠️ Intento de acceso no autorizado al cron job')
      return NextResponse.json(
        {
          error: 'No autorizado',
          message: 'Secret inválido',
        },
        { status: 401 }
      )
    }

    console.log('🔄 Iniciando cron job: lock-matches')

    // ============================================
    // 2. BUSCAR PARTIDOS A BLOQUEAR
    // ============================================
    const now = new Date()

    // Buscar partidos donde lockTime <= now() Y isLocked = false
    const matchesToLock = await prisma.match.findMany({
      where: {
        lockTime: {
          lte: now, // lockTime <= now()
        },
        isLocked: false,
        status: 'SCHEDULED', // Solo bloquear partidos programados (no finalizados)
      },
      select: {
        id: true,
        lockTime: true,
        matchDate: true,
        homeTeam: {
          select: {
            name: true,
            code: true,
          },
        },
        awayTeam: {
          select: {
            name: true,
            code: true,
          },
        },
      },
      orderBy: {
        lockTime: 'asc', // Ordenar por lockTime para logging
      },
    })

    console.log(
      `📊 Encontrados ${matchesToLock.length} partido(s) para bloquear`
    )

    // ============================================
    // 3. BLOQUEAR PARTIDOS
    // ============================================
    if (matchesToLock.length === 0) {
      const duration = Date.now() - startTime
      console.log(
        `✅ Cron job completado. No hay partidos para bloquear. (${duration}ms)`
      )

      return NextResponse.json({
        success: true,
        message: 'Cron job ejecutado exitosamente',
        lockedCount: 0,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
      })
    }

    // Bloquear cada partido
    const lockPromises = matchesToLock.map(async (match) => {
      try {
        await prisma.match.update({
          where: { id: match.id },
          data: { isLocked: true },
        })

        lockedCount++

        // Log detallado de cada partido bloqueado
        const lockTimeStr = match.lockTime.toISOString()
        const matchDateStr = match.matchDate.toISOString()
        const delay = now.getTime() - match.lockTime.getTime()
        const delayMinutes = Math.floor(delay / (1000 * 60))

        console.log(`🔒 Partido bloqueado:`, {
          id: match.id,
          match: `${match.homeTeam.name} vs ${match.awayTeam.name}`,
          lockTime: lockTimeStr,
          matchDate: matchDateStr,
          delayMinutes: `${delayMinutes} minutos`,
        })
      } catch (error) {
        errorCount++
        const errorMessage = `Error bloqueando partido ${match.id}: ${error instanceof Error ? error.message : 'Error desconocido'}`
        errors.push(errorMessage)
        console.error(`❌ ${errorMessage}`, error)
      }
    })

    await Promise.all(lockPromises)

    // ============================================
    // 4. LOGGING Y RESPUESTA
    // ============================================
    const duration = Date.now() - startTime

    if (errorCount > 0) {
      console.error(`⚠️ Cron job completado con errores:`, {
        lockedCount,
        errorCount,
        errors,
        duration: `${duration}ms`,
      })
    } else {
      console.log(`✅ Cron job completado exitosamente:`, {
        lockedCount,
        duration: `${duration}ms`,
      })
    }

    return NextResponse.json({
      success: errorCount === 0,
      message:
        errorCount === 0
          ? 'Cron job ejecutado exitosamente'
          : 'Cron job ejecutado con algunos errores',
      lockedCount,
      errorCount,
      errors: errors.length > 0 ? errors : undefined,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error('❌ Error crítico en cron job lock-matches:', error)
    console.error(`⏱️ Duración antes del error: ${duration}ms`)

    return handleApiError(error)
  }
}

/**
 * GET /api/cron/lock-matches
 *
 * Endpoint para verificar el estado del cron job (sin ejecutarlo)
 * Útil para testing y monitoring
 */
export async function GET(req: NextRequest) {
  try {
    // Verificar autorización (opcional para GET, útil para monitoring)
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (authHeader && cronSecret && authHeader === `Bearer ${cronSecret}`) {
      // Si está autorizado, mostrar información detallada
      const now = new Date()

      const matchesToLock = await prisma.match.count({
        where: {
          lockTime: {
            lte: now,
          },
          isLocked: false,
          status: 'SCHEDULED',
        },
      })

      const totalScheduled = await prisma.match.count({
        where: {
          status: 'SCHEDULED',
        },
      })

      const totalLocked = await prisma.match.count({
        where: {
          isLocked: true,
        },
      })

      return NextResponse.json({
        endpoint: '/api/cron/lock-matches',
        method: 'POST',
        schedule: '*/5 * * * * (cada 5 minutos)',
        status: 'active',
        stats: {
          pendingToLock: matchesToLock,
          totalScheduled,
          totalLocked,
        },
        timestamp: new Date().toISOString(),
      })
    }

    // Sin autorización, solo información básica
    return NextResponse.json({
      endpoint: '/api/cron/lock-matches',
      method: 'POST',
      schedule: '*/5 * * * * (cada 5 minutos)',
      status: 'configured',
      message: 'Usa POST con authorization header para ejecutar',
    })
  } catch (error) {
    return handleApiError(error)
  }
}
