import { prisma } from '../lib/prisma';
import { NotFoundError } from '../lib/http-errors';

export async function likePost(postId: string, userId: string): Promise<{ likeCount: number }> {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new NotFoundError('Post no encontrado');

  // upsert (no "buscar y crear"): la PK compuesta @@id([userId, postId]) evita
  // el doble like incluso ante una condición de carrera entre dos requests.
  await prisma.like.upsert({
    where: { userId_postId: { userId, postId } },
    create: { userId, postId },
    update: {},
  });

  const likeCount = await prisma.like.count({ where: { postId } });
  return { likeCount };
}

export async function unlikePost(postId: string, userId: string): Promise<{ likeCount: number }> {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new NotFoundError('Post no encontrado');

  await prisma.like.deleteMany({ where: { userId, postId } });

  const likeCount = await prisma.like.count({ where: { postId } });
  return { likeCount };
}
