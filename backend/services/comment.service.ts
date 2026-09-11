import { prisma } from '../lib/prisma';
import { NotFoundError, ForbiddenError } from '../lib/http-errors';
import { toCommentDTO, type CommentDTO, type CreateCommentInput } from '../domain/comment';

export async function listCommentsForPost(postId: string): Promise<CommentDTO[]> {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new NotFoundError('Post no encontrado');

  const comments = await prisma.comment.findMany({
    where: { postId },
    include: { author: true },
    orderBy: { createdAt: 'asc' },
  });
  return comments.map(toCommentDTO);
}

export async function createComment(postId: string, authorId: string, input: CreateCommentInput): Promise<CommentDTO> {
  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) throw new NotFoundError('Post no encontrado');

  const comment = await prisma.comment.create({
    data: { content: input.content, postId, authorId },
    include: { author: true },
  });
  return toCommentDTO(comment);
}

export async function deleteComment(commentId: string, requesterId: string): Promise<void> {
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    include: { post: true },
  });
  if (!comment) throw new NotFoundError('Comentario no encontrado');

  // Acá agregamos una regla más que en post.service.ts: dejamos borrar el
  // comentario tanto a quien lo escribió como al dueño del post donde está.
  const isCommentAuthor = comment.authorId === requesterId;
  const isPostAuthor = comment.post.authorId === requesterId;
  if (!isCommentAuthor && !isPostAuthor) {
    throw new ForbiddenError('No podés borrar este comentario');
  }

  await prisma.comment.delete({ where: { id: commentId } });
}
