import { z } from 'zod'

export const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, 'El email es requerido')
      .trim() // PRIMERO trim
      .toLowerCase() // LUEGO lowercase
      .email('Formato de email inválido'), // FINALMENTE validar
    name: z
      .string()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(50, 'El nombre no puede exceder 50 caracteres')
      .trim(),
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .regex(/[A-Z]/, 'La contraseña debe contener al menos una mayúscula')
      .regex(/[0-9]/, 'La contraseña debe contener al menos un número'),
    confirmPassword: z.string().min(1, 'Por favor confirma tu contraseña'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

export type RegisterInput = z.infer<typeof registerSchema>
export type RegisterFormInput = RegisterInput // Para el formulario completo con confirmPassword

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido')
    .trim()
    .toLowerCase()
    .email('Formato de email inválido'),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'El token es requerido'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'La contraseña debe contener al menos una mayúscula')
    .regex(/[0-9]/, 'La contraseña debe contener al menos un número'),
})

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido')
    .trim()
    .toLowerCase()
    .email('Formato de email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
})

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type LoginInput = z.infer<typeof loginSchema>
