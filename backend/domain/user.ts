import { z } from 'zod';
import type { User } from '@prisma/client';

// --- Schemas de entrada (Zod) --------------------------------------------
// Zod hace *strip* de cualquier campo no declarado en el schema (ej. un
// { "role": "admin" } de más se descarta), lo que evita mass assignment.

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email('Email inválido').max(255),
  username: z
    .string()
    .trim()
    .min(3, 'El username debe tener al menos 3 caracteres')
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, 'El username solo puede tener letras, números y guion bajo'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(72),
  displayName: z.string().trim().min(1, 'El nombre no puede estar vacío').max(60),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

export const updateProfileSchema = z.object({
  displayName: z.string().trim().min(1).max(60).optional(),
  bio: z.string().trim().max(280).optional(),
});

// Acá solo se valida que el ID token venga presente; la verificación real
// (firma, issuer, audience, expiración) la hace google-auth-library en auth.service.ts.
export const googleLoginSchema = z.object({
  credential: z.string().min(1, 'Falta el credential de Google'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type GoogleLoginInput = z.infer<typeof googleLoginSchema>;

// --- Mappers de salida (DTOs) ---------------------------------------------
export interface PublicUser {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  createdAt: Date;
}

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    bio: user.bio,
    createdAt: user.createdAt,
  };
}

// El propio usuario logueado ve su email; otro perfil visto desde afuera, no.
export interface AuthenticatedUser extends PublicUser {
  email: string;
}

export function toAuthenticatedUser(user: User): AuthenticatedUser {
  return {
    ...toPublicUser(user),
    email: user.email,
  };
}
