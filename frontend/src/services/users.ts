import { apiRequest } from '@/lib/api-client';
import type { AuthenticatedUser, PublicUser } from '@/types/api';
import type { UpdateProfileInput } from '@/schemas/auth';

export async function getPublicProfile(username: string): Promise<PublicUser> {
  const { user } = await apiRequest<{ user: PublicUser }>(`/api/users/${username}`);
  return user;
}

export async function updateProfile(input: UpdateProfileInput): Promise<AuthenticatedUser> {
  const { user } = await apiRequest<{ user: AuthenticatedUser }>('/api/users/me', { method: 'PATCH', body: input });
  return user;
}
