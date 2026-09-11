import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/auth/use-auth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import * as postsService from '@/services/posts';
import { ApiError } from '@/lib/api-error';
import { createCommentSchema, type CreateCommentInput } from '@/schemas/post';
import type { CommentDTO } from '@/types/api';

export function CommentList({ postId, postAuthorId }: { postId: string; postAuthorId: string }) {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentDTO[] | null>(null);

  const form = useForm<CreateCommentInput>({
    resolver: zodResolver(createCommentSchema),
    defaultValues: { content: '' },
  });

  const content = form.watch('content');

  useEffect(() => {
    postsService
      .listComments(postId)
      .then(setComments)
      .catch(() => setComments([]));
  }, [postId]);

  async function onSubmit(input: CreateCommentInput) {
    try {
      const comment = await postsService.createComment(postId, input);
      setComments((prev) => [...(prev ?? []), comment]);
      form.reset();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'No se pudo comentar');
    }
  }

  async function handleDelete(commentId: string) {
    try {
      await postsService.deleteComment(commentId);
      setComments((prev) => prev?.filter((c) => c.id !== commentId) ?? null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'No se pudo borrar el comentario');
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-2">
        <Textarea placeholder="Comentá algo" maxLength={280} rows={2} {...form.register('content')} />
        {form.formState.errors.content && (
          <p className="text-sm text-destructive">{form.formState.errors.content.message}</p>
        )}
        <Button
          type="submit"
          size="sm"
          className="self-end"
          disabled={form.formState.isSubmitting || !content?.trim()}
        >
          Comentar
        </Button>
      </form>

      {comments === null && (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      )}

      {comments?.length === 0 && <p className="text-sm text-muted-foreground">Todavía no hay comentarios.</p>}

      {comments?.map((comment) => {
        // Puede borrar el autor del comentario o el del post (backend/services/comment.service.ts);
        // esto solo evita mostrar un botón que el servidor rechazaría con 403.
        const canDelete = user?.id === comment.author.id || user?.id === postAuthorId;
        return (
          <div key={comment.id} className="flex gap-3 border-t pt-3 first:border-t-0 first:pt-0">
            <Link to={`/u/${comment.author.username}`}>
              <Avatar size="sm">
                <AvatarFallback>{comment.author.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Link to={`/u/${comment.author.username}`} className="text-sm font-medium hover:underline">
                  {comment.author.displayName}
                </Link>
                <span className="text-xs text-muted-foreground">@{comment.author.username}</span>
              </div>
              <p className="whitespace-pre-wrap break-words text-sm">{comment.content}</p>
            </div>
            {canDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground hover:text-destructive"
                onClick={() => handleDelete(comment.id)}
                aria-label="Borrar comentario"
              >
                <Trash2 className="size-3.5" />
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
