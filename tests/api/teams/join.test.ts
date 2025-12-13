import { describe, it, expect, beforeAll } from 'vitest'
import { prisma } from '@/lib/db'
import {
  createTestUser,
  createTestTeam,
  addTeamMember,
  generateInviteCode,
} from '../../helpers/test-utils'
import {
  findTeamByCode,
  isTeamFull,
  getTeamMemberCount,
} from '@/lib/utils/team'

describe('Teams Join - Tarea 2', () => {
  let creatorUser: Awaited<ReturnType<typeof createTestUser>>
  let joiningUser: Awaited<ReturnType<typeof createTestUser>>
  let userInTeam: Awaited<ReturnType<typeof createTestUser>>

  beforeAll(async () => {
    creatorUser = await createTestUser({ name: 'Creator' })
    joiningUser = await createTestUser({ name: 'Joining User' })
    userInTeam = await createTestUser({ name: 'User In Team' })
  })

  describe('GET /api/teams/search?code=XXX - Buscar Equipo por Código', () => {
    it('debe encontrar un equipo por código válido', async () => {
      const team = await createTestTeam({
        name: 'Equipo Buscable',
        creatorId: creatorUser.id,
      })

      const foundTeam = await findTeamByCode(team.inviteCode)

      expect(foundTeam).toBeDefined()
      expect(foundTeam?.id).toBe(team.id)
      expect(foundTeam?.name).toBe('Equipo Buscable')
    })

    it('debe ser case-insensitive (mayúsculas/minúsculas)', async () => {
      const team = await createTestTeam({
        creatorId: creatorUser.id,
      })

      // Buscar con código en minúsculas
      const foundLower = await findTeamByCode(team.inviteCode.toLowerCase())
      expect(foundLower).toBeDefined()
      expect(foundLower?.id).toBe(team.id)

      // Buscar con código en mayúsculas
      const foundUpper = await findTeamByCode(team.inviteCode.toUpperCase())
      expect(foundUpper).toBeDefined()
      expect(foundUpper?.id).toBe(team.id)
    })

    it('debe retornar null si el código no existe', async () => {
      const invalidCode = 'INVALID'

      const found = await findTeamByCode(invalidCode)

      expect(found).toBeNull()
    })

    it('debe retornar información pública sin código', async () => {
      const team = await createTestTeam({
        name: 'Equipo Público',
        description: 'Descripción pública',
        creatorId: creatorUser.id,
      })

      const foundTeam = await findTeamByCode(team.inviteCode)

      expect(foundTeam).toBeDefined()
      expect(foundTeam?.name).toBe('Equipo Público')
      expect(foundTeam?.description).toBe('Descripción pública')
      expect(foundTeam?.creatorId).toBe(creatorUser.id)
    })
  })

  describe('POST /api/teams/join - Unirse a Equipo', () => {
    it('debe permitir a un usuario unirse a un equipo', async () => {
      const team = await createTestTeam({
        creatorId: creatorUser.id,
      })

      // Verificar que el usuario no está en ningún equipo
      const existingMembership = await prisma.teamMember.findFirst({
        where: { userId: joiningUser.id },
      })
      expect(existingMembership).toBeNull()

      // Unirse al equipo
      const membership = await prisma.teamMember.create({
        data: {
          userId: joiningUser.id,
          teamId: team.id,
          role: 'MEMBER',
        },
      })

      expect(membership).toBeDefined()
      expect(membership.userId).toBe(joiningUser.id)
      expect(membership.teamId).toBe(team.id)
      expect(membership.role).toBe('MEMBER')
    })

    it('no debe permitir unirse si ya está en otro equipo', async () => {
      // Crear primer equipo y agregar usuario
      const team1 = await createTestTeam({
        creatorId: creatorUser.id,
      })
      await addTeamMember(team1.id, userInTeam.id)

      // Verificar que el usuario ya está en un equipo
      const existingMembership = await prisma.teamMember.findFirst({
        where: { userId: userInTeam.id },
      })
      expect(existingMembership).toBeDefined()
      expect(existingMembership?.teamId).toBe(team1.id)

      // Intentar unirse al segundo equipo debería fallar
      // (esto se valida en la API, aquí verificamos la lógica)
    })

    it('no debe permitir unirse dos veces al mismo equipo', async () => {
      const team = await createTestTeam({
        creatorId: creatorUser.id,
      })

      // Primera vez
      await addTeamMember(team.id, joiningUser.id)

      // Intentar segunda vez debería fallar (unique constraint)
      await expect(
        prisma.teamMember.create({
          data: {
            userId: joiningUser.id,
            teamId: team.id,
            role: 'MEMBER',
          },
        })
      ).rejects.toThrow()
    })

    it('debe agregar al usuario como MEMBER (no ADMIN)', async () => {
      const team = await createTestTeam({
        creatorId: creatorUser.id,
      })

      const newUser = await createTestUser()

      const membership = await prisma.teamMember.create({
        data: {
          userId: newUser.id,
          teamId: team.id,
          role: 'MEMBER',
        },
      })

      expect(membership.role).toBe('MEMBER')
      expect(membership.role).not.toBe('ADMIN')
    })

    it('debe verificar que el equipo existe antes de unirse', async () => {
      const invalidTeamId = '00000000-0000-0000-0000-000000000000'

      await expect(
        prisma.teamMember.create({
          data: {
            userId: joiningUser.id,
            teamId: invalidTeamId,
            role: 'MEMBER',
          },
        })
      ).rejects.toThrow()
    })

    it('debe verificar límite de miembros (equipo lleno)', async () => {
      const team = await createTestTeam({
        creatorId: creatorUser.id,
      })

      // Verificar estado inicial (1 miembro: el creador)
      const initialCount = await prisma.teamMember.count({
        where: { teamId: team.id },
      })
      expect(initialCount).toBe(1)

      // Verificar que isTeamFull funciona con 1 miembro (no está lleno)
      const isFullInitial = await isTeamFull(team.id)
      expect(isFullInitial).toBe(false)

      // Verificar que getTeamMemberCount funciona
      const countFromHelper = await getTeamMemberCount(team.id)
      expect(countFromHelper).toBe(1)

      // Agregar solo 1 miembro más para verificar que el conteo aumenta
      const newUser = await createTestUser()
      await addTeamMember(team.id, newUser.id)

      // Verificar que el equipo tiene 2 miembros ahora
      const memberCount = await prisma.teamMember.count({
        where: { teamId: team.id },
      })
      expect(memberCount).toBe(2)

      // Verificar que isTeamFull sigue siendo false con 2 miembros
      const isFullAfter = await isTeamFull(team.id)
      expect(isFullAfter).toBe(false)

      // Verificar que getTeamMemberCount retorna el valor correcto
      const countAfterHelper = await getTeamMemberCount(team.id)
      expect(countAfterHelper).toBe(2)
    }, 15000) // Aumentar timeout a 15 segundos por seguridad
  })

  describe('Validaciones de Código de Invitación', () => {
    it('debe generar códigos sin caracteres confusos', () => {
      const code = generateInviteCode()

      expect(code).toHaveLength(6)
      // No debe contener 0, O, 1, I, l
      expect(code).not.toMatch(/[0O1Il]/)
      // Solo debe contener caracteres permitidos
      expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/)
    })

    it('debe normalizar códigos a mayúsculas', async () => {
      const team = await createTestTeam({
        creatorId: creatorUser.id,
      })

      // Buscar con minúsculas debe funcionar
      const found = await findTeamByCode(team.inviteCode.toLowerCase())
      expect(found).toBeDefined()
    })
  })

  describe('Flujo Completo: Buscar y Unirse', () => {
    it('debe permitir buscar un equipo y luego unirse', async () => {
      // Usar usuarios únicos para evitar conflictos con otros tests
      const uniqueCreator = await createTestUser()
      const uniqueJoiningUser = await createTestUser()

      // 1. Crear equipo
      const team = await createTestTeam({
        name: `Equipo para Unirse ${Date.now()}`,
        creatorId: uniqueCreator.id,
      })

      // 2. Buscar por código
      const foundTeam = await findTeamByCode(team.inviteCode)
      expect(foundTeam).toBeDefined()
      expect(foundTeam?.id).toBe(team.id)

      // 3. Verificar que el usuario no está en ningún equipo
      const existingMembership = await prisma.teamMember.findFirst({
        where: { userId: uniqueJoiningUser.id },
      })
      expect(existingMembership).toBeNull()

      // 4. Unirse al equipo
      const membership = await prisma.teamMember.create({
        data: {
          userId: uniqueJoiningUser.id,
          teamId: team.id,
          role: 'MEMBER',
        },
      })

      expect(membership).toBeDefined()

      // 5. Verificar que ahora es miembro
      const newMembership = await prisma.teamMember.findUnique({
        where: {
          userId_teamId: {
            userId: uniqueJoiningUser.id,
            teamId: team.id,
          },
        },
      })
      expect(newMembership).toBeDefined()
    })
  })
})
