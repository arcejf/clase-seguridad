import { z } from 'zod';
import type { Comment, User } from '@prisma/client';
import { toPublicUser, type PublicUser } from './user';

export const createCommentSchema = z.object({
  content: z.string().trim().min(1, 'El comentario no puede estar vacío').max(280, 'Máximo 280 caracteres'),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;

export interface CommentDTO {
  id: string;
  content: string;
  postId: string;
  createdAt: Date;
  author: PublicUser;
}

type CommentWithAuthor = Comment & { author: User };

export function toCommentDTO(comment: CommentWithAuthor): CommentDTO {
  return {
    id: comment.id,
    content: comment.content,
    postId: comment.postId,
    createdAt: comment.createdAt,
    author: toPublicUser(comment.author),
  };
}
