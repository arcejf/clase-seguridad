import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import * as postsApi from '@/api/posts.api';
import { ApiError } from '@/lib/api-error';
import { createPostSchema, type CreatePostInput } from '@/schemas/post.schemas';
import type { PostDTO } from '@/types/api';

export function PostComposer({ onCreated }: { onCreated: (post: PostDTO) => void }) {
  const form = useForm<CreatePostInput>({
    resolver: zodResolver(createPostSchema),
    defaultValues: { content: '' },
  });

  const content = form.watch('content');
  const length = content?.length ?? 0;

  async function onSubmit(input: CreatePostInput) {
    try {
      const post = await postsApi.createPost(input);
      onCreated(post);
      form.reset();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'No se pudo publicar el post');
    }
  }

  return (
    <Card className="gap-3 py-4">
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
        <CardContent className="px-4">
          <Textarea placeholder="Qué está pasando" maxLength={280} rows={3} {...form.register('content')} />
          {form.formState.errors.content && (
            <p className="mt-1 text-sm text-destructive">{form.formState.errors.content.message}</p>
          )}
        </CardContent>
        <CardFooter className="justify-between px-4">
          <span className="text-xs text-muted-foreground">{length > 0 ? `${length}/280` : ''}</span>
          <Button type="submit" disabled={form.formState.isSubmitting || length === 0}>
            Publicar
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
