import { z } from 'zod';
import type { Post, User } from '@prisma/client';
import { toPublicUser, type PublicUser } from './user';

export const createPostSchema = z.object({
  content: z.string().trim().min(1, 'El post no puede estar vacío').max(280, 'Máximo 280 caracteres'),
});

// Le ponemos un tope al limit de paginación: sin esto, alguien podría pedir
// `?limit=1000000` y forzar al servidor a traer toda la tabla de una, un DoS
// bastante fácil de hacer.
const MAX_PAGE_SIZE = 50;
const DEFAULT_PAGE_SIZE = 20;

export const listPostsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
  cursor: z.string().optional(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type ListPostsQuery = z.infer<typeof listPostsQuerySchema>;

export interface PostDTO {
  id: string;
  content: string;
  createdAt: Date;
  author: PublicUser;
  commentCount: number;
  likeCount: number;
  likedByCurrentUser: boolean;
}

type PostWithRelations = Post & {
  author: User;
  _count: { comments: number; likes: number };
  likes?: { userId: string }[];
};

// Usamos el mismo criterio que en user.ts: el autor pasa por toPublicUser()
// antes de devolverse, para que no se filtre el passwordHash sin querer.
export function toPostDTO(post: PostWithRelations, currentUserId?: string): PostDTO {
  return {
    id: post.id,
    content: post.content,
    createdAt: post.createdAt,
    author: toPublicUser(post.author),
    commentCount: post._count.comments,
    likeCount: post._count.likes,
    likedByCurrentUser: currentUserId ? (post.likes?.some((like) => like.userId === currentUserId) ?? false) : false,
  };
}
