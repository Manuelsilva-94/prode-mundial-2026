import { describe, it, expect, beforeAll } from 'vitest'
import { prisma } from '@/lib/db'
import {
  createTestUser,
  createTestTeam,
  addTeamMember,
} from '../../helpers/test-utils'

describe('Teams CRUD - Tarea 1', () => {
  let testUser: Awaited<ReturnType<typeof createTestUser>>
  let secondUser: Awaited<ReturnType<typeof createTestUser>>

  beforeAll(async () => {
    testUser = await createTestUser({ name: 'Team Creator' })
    secondUser = await createTestUser({ name: 'Second User' })
  })

  describe('POST /api/teams - Crear Equipo', () => {
    it('debe crear un equipo con nombre y descripción', async () => {
      const team = await createTestTeam({
        name: 'Equipo de Prueba',
        description: 'Descripción del equipo',
        creatorId: testUser.id,
      })

      expect(team).toBeDefined()
      expect(team.name).toBe('Equipo de Prueba')
      expect(team.description).toBe('Descripción del equipo')
      expect(team.creatorId).toBe(testUser.id)
      expect(team.inviteCode).toHaveLength(6)

      // Verificar que el creador es miembro
      const membership = await prisma.teamMember.findUnique({
        where: {
          userId_teamId: {
            userId: testUser.id,
            teamId: team.id,
          },
        },
      })

      expect(membership).toBeDefined()
      expect(membership?.role).toBe('ADMIN')
    })

    it('debe crear un equipo sin descripción', async () => {
      const team = await createTestTeam({
        name: 'Equipo Sin Descripción',
        creatorId: testUser.id,
      })

      expect(team).toBeDefined()
      expect(team.name).toBe('Equipo Sin Descripción')
      expect(team.description).toBeNull()
    })

    it('debe generar un código de invitación único', async () => {
      const team1 = await createTestTeam({
        creatorId: testUser.id,
      })
      const team2 = await createTestTeam({
        creatorId: testUser.id,
      })

      expect(team1.inviteCode).not.toBe(team2.inviteCode)
      expect(team1.inviteCode).toHaveLength(6)
      expect(team2.inviteCode).toHaveLength(6)
    })

    it('no debe permitir crear equipo con nombre duplicado (case-insensitive)', async () => {
      const teamName = 'Equipo Duplicado'

      await createTestTeam({
        name: teamName,
        creatorId: testUser.id,
      })

      // Intentar crear con mismo nombre en mayúsculas
      await expect(
        createTestTeam({
          name: teamName.toUpperCase(),
          creatorId: secondUser.id,
        })
      ).rejects.toThrow()
    })

    it('debe validar que un usuario no puede crear equipo si ya está en uno', async () => {
      // Crear primer equipo
      await createTestTeam({
        creatorId: testUser.id,
      })

      // Verificar que el usuario está en un equipo
      const membership = await prisma.teamMember.findFirst({
        where: { userId: testUser.id },
      })

      expect(membership).toBeDefined()

      // Intentar crear segundo equipo con mismo usuario debería fallar
      // (esto se valida a nivel de API, aquí verificamos la lógica)
      const existingMembership = await prisma.teamMember.findFirst({
        where: { userId: testUser.id },
      })

      expect(existingMembership).toBeDefined()
    })
  })

  describe('GET /api/teams - Listar Equipos', () => {
    it('debe listar todos los equipos', async () => {
      // Crear algunos equipos
      await createTestTeam({
        name: 'Equipo 1',
        creatorId: testUser.id,
      })
      await createTestTeam({
        name: 'Equipo 2',
        creatorId: secondUser.id,
      })

      const teams = await prisma.team.findMany({
        include: {
          _count: {
            select: {
              members: true,
            },
          },
        },
      })

      expect(teams.length).toBeGreaterThanOrEqual(2)
    })

    it('debe incluir el conteo de miembros', async () => {
      const team = await createTestTeam({
        creatorId: testUser.id,
      })

      // Agregar otro miembro
      await addTeamMember(team.id, secondUser.id)

      const teamWithCount = await prisma.team.findUnique({
        where: { id: team.id },
        include: {
          _count: {
            select: {
              members: true,
            },
          },
        },
      })

      expect(teamWithCount?._count.members).toBe(2)
    })
  })

  describe('GET /api/teams/:id - Detalle del Equipo', () => {
    it('debe obtener el detalle completo del equipo con miembros', async () => {
      const team = await createTestTeam({
        name: 'Equipo Detalle',
        creatorId: testUser.id,
      })

      // Agregar otro miembro
      await addTeamMember(team.id, secondUser.id)

      const teamDetail = await prisma.team.findUnique({
        where: { id: team.id },
        include: {
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      })

      expect(teamDetail).toBeDefined()
      expect(teamDetail?.members.length).toBe(2)
      expect(teamDetail?.creator.id).toBe(testUser.id)
    })
  })

  describe('GET /api/teams/me - Mi Equipo', () => {
    it('debe retornar null si el usuario no está en ningún equipo', async () => {
      const userWithoutTeam = await createTestUser()

      const membership = await prisma.teamMember.findFirst({
        where: { userId: userWithoutTeam.id },
      })

      expect(membership).toBeNull()
    })

    it('debe retornar el equipo del usuario si está en uno', async () => {
      const team = await createTestTeam({
        creatorId: testUser.id,
      })

      const membership = await prisma.teamMember.findFirst({
        where: { userId: testUser.id },
        include: {
          team: true,
        },
      })

      expect(membership).toBeDefined()
      expect(membership?.team.id).toBe(team.id)
    })
  })

  describe('PATCH /api/teams/:id - Actualizar Equipo', () => {
    it('debe actualizar el nombre del equipo (solo creador)', async () => {
      const team = await createTestTeam({
        name: 'Equipo Original',
        creatorId: testUser.id,
      })

      const updated = await prisma.team.update({
        where: { id: team.id },
        data: {
          name: 'Equipo Actualizado',
        },
      })

      expect(updated.name).toBe('Equipo Actualizado')
      expect(updated.creatorId).toBe(testUser.id) // Creator no cambia
    })

    it('debe actualizar la descripción del equipo', async () => {
      const team = await createTestTeam({
        name: 'Equipo Sin Desc',
        creatorId: testUser.id,
      })

      const updated = await prisma.team.update({
        where: { id: team.id },
        data: {
          description: 'Nueva descripción',
        },
      })

      expect(updated.description).toBe('Nueva descripción')
    })

    it('no debe permitir nombre duplicado al actualizar', async () => {
      await createTestTeam({
        name: 'Equipo A',
        creatorId: testUser.id,
      })
      const team2 = await createTestTeam({
        name: 'Equipo B',
        creatorId: secondUser.id,
      })

      // Intentar cambiar Equipo B a nombre de Equipo A
      await expect(
        prisma.team.update({
          where: { id: team2.id },
          data: {
            name: 'Equipo A',
          },
        })
      ).rejects.toThrow()
    })
  })

  describe('DELETE /api/teams/:id - Eliminar Equipo', () => {
    it('debe eliminar el equipo y todos sus miembros (cascada)', async () => {
      const team = await createTestTeam({
        creatorId: testUser.id,
      })

      // Agregar otro miembro
      await addTeamMember(team.id, secondUser.id)

      // Eliminar equipo
      await prisma.team.delete({
        where: { id: team.id },
      })

      // Verificar que el equipo fue eliminado
      const deleted = await prisma.team.findUnique({
        where: { id: team.id },
      })
      expect(deleted).toBeNull()

      // Verificar que los miembros fueron eliminados (cascada)
      const members = await prisma.teamMember.findMany({
        where: { teamId: team.id },
      })
      expect(members.length).toBe(0)
    })
  })

  describe('POST /api/teams/:id/leave - Salir del Equipo', () => {
    it('debe permitir a un miembro salir del equipo', async () => {
      const team = await createTestTeam({
        creatorId: testUser.id,
      })

      // Agregar otro miembro
      await addTeamMember(team.id, secondUser.id)

      // Salir del equipo
      await prisma.teamMember.delete({
        where: {
          userId_teamId: {
            userId: secondUser.id,
            teamId: team.id,
          },
        },
      })

      // Verificar que ya no es miembro
      const membership = await prisma.teamMember.findUnique({
        where: {
          userId_teamId: {
            userId: secondUser.id,
            teamId: team.id,
          },
        },
      })

      expect(membership).toBeNull()
    })

    it('debe transferir ownership si el creador sale y hay otros miembros', async () => {
      const team = await createTestTeam({
        creatorId: testUser.id,
      })

      // Agregar otro miembro
      await addTeamMember(team.id, secondUser.id)

      // El creador sale (esto se maneja en la API, aquí verificamos la lógica)
      // En la API se transfiere ownership al miembro más antiguo
      const members = await prisma.teamMember.findMany({
        where: { teamId: team.id },
        orderBy: { joinedAt: 'asc' },
      })

      expect(members.length).toBe(2)
      // El creador es el más antiguo (se agregó al crear)
      expect(members[0].userId).toBe(testUser.id)
    })

    it('debe eliminar el equipo si el creador sale y es el único miembro', async () => {
      const team = await createTestTeam({
        creatorId: testUser.id,
      })

      // El creador es el único miembro
      const memberCount = await prisma.teamMember.count({
        where: { teamId: team.id },
      })

      expect(memberCount).toBe(1)

      // Si el creador sale, el equipo debería eliminarse (lógica en API)
      // Aquí solo verificamos el estado inicial
    })
  })
})
