import { prisma } from '../lib/prisma';
import { NotFoundError } from '../lib/http-errors';
import { toAuthenticatedUser, toPublicUser, type AuthenticatedUser, type PublicUser, type UpdateProfileInput } from '../domain/user';

export async function getAuthenticatedUser(userId: string): Promise<AuthenticatedUser> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError('Usuario no encontrado');
  return toAuthenticatedUser(user);
}

// Para el perfil público usamos toPublicUser, no toAuthenticatedUser, así
// nunca se filtra el email de otra persona.
export async function getPublicProfile(username: string): Promise<PublicUser> {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) throw new NotFoundError('Usuario no encontrado');
  return toPublicUser(user);
}

export async function updateProfile(userId: string, input: UpdateProfileInput): Promise<AuthenticatedUser> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: input,
  });
  return toAuthenticatedUser(user);
}
