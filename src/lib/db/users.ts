import { prisma } from '@/lib/db'
import { User, UserRole } from '@prisma/client'

export async function createUser(data: {
  email: string
  name: string
  passwordHash: string
  role?: UserRole
}) {
  return await prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      passwordHash: data.passwordHash,
      role: data.role || 'USER',
    },
  })
}

export async function getUserByEmail(email: string) {
  return await prisma.user.findUnique({
    where: { email },
  })
}

export async function getUserById(id: string) {
  return await prisma.user.findUnique({
    where: { id },
    include: {
      teamMemberships: {
        include: {
          team: true,
        },
      },
      leaderboardCache: true,
    },
  })
}

export async function updateUserProfile(
  userId: string,
  data: {
    name?: string
    avatarUrl?: string
  }
) {
  return await prisma.user.update({
    where: { id: userId },
    data,
  })
}
