import { z } from 'zod';

// Espejo de backend/domain/post.ts y comment.ts.
export const createPostSchema = z.object({
  content: z.string().trim().min(1, 'El post no puede estar vacío').max(280, 'Máximo 280 caracteres'),
});

export const createCommentSchema = z.object({
  content: z.string().trim().min(1, 'El comentario no puede estar vacío').max(280, 'Máximo 280 caracteres'),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
