import { z } from 'zod'

/**
 * Schema para crear un equipo
 */
export const createTeamSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre del equipo debe tener al menos 2 caracteres')
    .max(100, 'El nombre del equipo no puede exceder 100 caracteres')
    .trim(),
  description: z
    .string()
    .max(500, 'La descripción no puede exceder 500 caracteres')
    .trim()
    .optional()
    .nullable(),
})

export type CreateTeamInput = z.infer<typeof createTeamSchema>

/**
 * Schema para actualizar un equipo
 */
export const updateTeamSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre del equipo debe tener al menos 2 caracteres')
    .max(100, 'El nombre del equipo no puede exceder 100 caracteres')
    .trim()
    .optional(),
  description: z
    .string()
    .max(500, 'La descripción no puede exceder 500 caracteres')
    .trim()
    .optional()
    .nullable(),
})

export type UpdateTeamInput = z.infer<typeof updateTeamSchema>

/**
 * Schema para buscar equipo por código
 */
export const searchTeamSchema = z.object({
  code: z
    .string()
    .length(6, 'El código debe tener exactamente 6 caracteres')
    .regex(
      /^[A-Z0-9]+$/,
      'El código solo puede contener letras mayúsculas y números'
    )
    .transform((val) => val.toUpperCase()),
})

export type SearchTeamInput = z.infer<typeof searchTeamSchema>

/**
 * Schema para unirse a un equipo
 */
export const joinTeamSchema = z.object({
  teamId: z.string().uuid('El ID del equipo debe ser un UUID válido'),
})

export type JoinTeamInput = z.infer<typeof joinTeamSchema>
