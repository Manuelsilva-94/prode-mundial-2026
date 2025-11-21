import { z } from 'zod'

export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres')
    .trim()
    .optional(),
  avatarUrl: z
    .string()
    .url('Debe ser una URL válida')
    .max(500, 'La URL no puede exceder 500 caracteres')
    .optional()
    .nullable(),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
