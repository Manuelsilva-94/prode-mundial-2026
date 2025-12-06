import { prisma } from '@/lib/db'

/**
 * Caracteres permitidos para códigos de invitación
 * Excluye caracteres confusos: 0/O, 1/I/l
 */
const INVITE_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

/**
 * Genera un código de invitación único de 6 caracteres
 * Evita caracteres confusos (0/O, 1/I/l)
 */
export async function generateUniqueInviteCode(): Promise<string> {
  let attempts = 0
  const maxAttempts = 10

  while (attempts < maxAttempts) {
    const code = generateRandomCode(6)

    // Verificar si el código ya existe
    const exists = await prisma.team.findUnique({
      where: { inviteCode: code },
    })

    if (!exists) {
      return code
    }

    attempts++
  }

  throw new Error(
    'No se pudo generar un código único después de varios intentos'
  )
}

/**
 * Genera un código aleatorio con los caracteres permitidos
 */
function generateRandomCode(length: number): string {
  let code = ''
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * INVITE_CODE_CHARS.length)
    code += INVITE_CODE_CHARS[randomIndex]
  }
  return code
}

/**
 * Verifica si un usuario está en algún equipo
 */
export async function getUserTeam(userId: string) {
  const membership = await prisma.teamMember.findFirst({
    where: { userId },
    include: {
      team: {
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  })

  return membership
}

/**
 * Verifica si un usuario es el creador de un equipo
 */
export async function isTeamCreator(
  teamId: string,
  userId: string
): Promise<boolean> {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { creatorId: true },
  })

  return team?.creatorId === userId
}

/**
 * Verifica si un usuario es miembro de un equipo
 */
export async function isTeamMember(
  teamId: string,
  userId: string
): Promise<boolean> {
  const membership = await prisma.teamMember.findUnique({
    where: {
      userId_teamId: {
        userId,
        teamId,
      },
    },
  })

  return !!membership
}

/**
 * Obtiene el número de miembros de un equipo
 */
export async function getTeamMemberCount(teamId: string): Promise<number> {
  return prisma.teamMember.count({
    where: { teamId },
  })
}

/**
 * Obtiene todos los miembros de un equipo con sus estadísticas
 */
export async function getTeamMembersWithStats(teamId: string) {
  const members = await prisma.teamMember.findMany({
    where: { teamId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: {
      joinedAt: 'asc',
    },
  })

  // Obtener estadísticas de cada miembro
  const membersWithStats = await Promise.all(
    members.map(async (member) => {
      const stats = await prisma.leaderboardCache.findUnique({
        where: { userId: member.userId },
        select: {
          totalPoints: true,
          totalPredictions: true,
          correctPredictions: true,
          exactScores: true,
          accuracyRate: true,
          ranking: true,
        },
      })

      return {
        id: member.id,
        role: member.role,
        joinedAt: member.joinedAt,
        user: member.user,
        stats: stats || {
          totalPoints: 0,
          totalPredictions: 0,
          correctPredictions: 0,
          exactScores: 0,
          accuracyRate: 0,
          ranking: 0,
        },
      }
    })
  )

  return membersWithStats
}

/**
 * Busca un equipo por código de invitación (case-insensitive)
 */
export async function findTeamByCode(code: string) {
  // Normalizar código a mayúsculas
  const normalizedCode = code.toUpperCase().trim()

  const team = await prisma.team.findUnique({
    where: { inviteCode: normalizedCode },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
      _count: {
        select: {
          members: true,
        },
      },
    },
  })

  return team
}

/**
 * Límite máximo de miembros por equipo (opcional, configurable)
 */
const MAX_TEAM_MEMBERS = 50 // Configurable, puedes cambiarlo o hacerlo dinámico

/**
 * Verifica si un equipo está lleno (alcanzó el límite de miembros)
 */
export async function isTeamFull(teamId: string): Promise<boolean> {
  const memberCount = await getTeamMemberCount(teamId)
  return memberCount >= MAX_TEAM_MEMBERS
}

/**
 * Normaliza un código de invitación (case-insensitive)
 */
export function normalizeInviteCode(code: string): string {
  return code.toUpperCase().trim()
}
