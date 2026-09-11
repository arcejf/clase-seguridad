import { apiRequest } from '@/lib/api-client';
import type { AuthResponse, AuthenticatedUser } from '@/types/api';
import type { LoginInput } from '@/schemas/auth';

export interface RegisterPayload {
  email: string;
  username: string;
  displayName: string;
  password: string;
}

export function register(input: RegisterPayload): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/api/auth/register', { method: 'POST', body: input, skipAuth: true });
}

export function login(input: LoginInput): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/api/auth/login', { method: 'POST', body: input, skipAuth: true });
}

export function loginWithGoogle(credential: string): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/api/auth/google', { method: 'POST', body: { credential }, skipAuth: true });
}

// No hay un `refresh()` acá a propósito: /api/auth/refresh siempre se llama
// vía refreshAccessToken() en lib/api-client.ts (single-flight), nunca directo.

export function logout(): Promise<void> {
  return apiRequest<void>('/api/auth/logout', { method: 'POST', skipRefreshRetry: true });
}

export async function getMe(): Promise<AuthenticatedUser> {
  const { user } = await apiRequest<{ user: AuthenticatedUser }>('/api/auth/me');
  return user;
}
