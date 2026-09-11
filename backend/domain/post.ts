import { z } from 'zod';
import type { Post, User } from '@prisma/client';
import { toPublicUser, type PublicUser } from './user';

export const createPostSchema = z.object({
  content: z.string().trim().min(1, 'El post no puede estar vacío').max(280, 'Máximo 280 caracteres'),
});

// Tope máximo de paginación: sin esto, `?limit=1000000` fuerza al server a
// traer todo el dataset en una query, un vector de DoS barato.
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

// Mismo criterio whitelist que en user.ts: el autor pasa por toPublicUser()
// antes de exponerse, para que no salga un passwordHash de arrastre.
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
