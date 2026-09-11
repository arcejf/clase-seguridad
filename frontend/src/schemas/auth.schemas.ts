import { z } from 'zod';

// Espejo de backend/domain/user.ts. Esta validación es SOLO para feedback
// inmediato en el formulario (UX); la que realmente protege corre en el
// servidor, donde el cliente no la puede saltear.
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

export const registerSchema = z
  .object({
    email: z.string().trim().toLowerCase().email('Email inválido').max(255),
    username: z
      .string()
      .trim()
      .min(3, 'Al menos 3 caracteres')
      .max(30)
      .regex(/^[a-zA-Z0-9_]+$/, 'Solo letras, números y guion bajo'),
    displayName: z.string().trim().min(1, 'El nombre no puede estar vacío').max(60),
    password: z.string().min(8, 'Al menos 8 caracteres').max(72),
    // Campo solo del cliente; el backend nunca recibe "confirmPassword".
    confirmPassword: z.string().min(1, 'Confirmá la contraseña'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

export const updateProfileSchema = z.object({
  displayName: z.string().trim().min(1, 'El nombre no puede estar vacío').max(60),
  bio: z.string().trim().max(280, 'Máximo 280 caracteres'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
