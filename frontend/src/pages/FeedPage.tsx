import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PostComposer } from '@/components/PostComposer';
import { PostCard } from '@/components/PostCard';
import * as postsService from '@/services/posts';
import { ApiError } from '@/lib/api-error';
import type { PostDTO } from '@/types/api';

function PostSkeleton() {
  return (
    <Card className="gap-3 py-4">
      <CardHeader className="flex items-center gap-3 px-4">
        <Skeleton className="size-8 shrink-0 rounded-full" />
        <div className="flex flex-1 flex-col gap-1.5">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </CardHeader>
      <CardContent className="px-4">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="mt-2 h-3.5 w-2/3" />
      </CardContent>
    </Card>
  );
}

export function FeedPage() {
  const [posts, setPosts] = useState<PostDTO[] | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    postsService
      .listPosts()
      .then((res) => {
        setPosts(res.posts);
        setNextCursor(res.nextCursor);
      })
      .catch((err) => toast.error(err instanceof ApiError ? err.message : 'No se pudo cargar el feed'));
  }, []);

  async function loadMore() {
    if (!nextCursor) return;
    setLoadingMore(true);
    try {
      const res = await postsService.listPosts(nextCursor);
      setPosts((prev) => [...(prev ?? []), ...res.posts]);
      setNextCursor(res.nextCursor);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'No se pudo cargar más posts');
    } finally {
      setLoadingMore(false);
    }
  }

  function handleDeleted(postId: string) {
    setPosts((prev) => prev?.filter((p) => p.id !== postId) ?? null);
  }

  return (
    <>
      <PostComposer onCreated={(post) => setPosts((prev) => [post, ...(prev ?? [])])} />

      {posts === null && (
        <>
          <PostSkeleton />
          <PostSkeleton />
          <PostSkeleton />
        </>
      )}

      {posts?.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Todavía no hay nada publicado. Escribí el primer post.
        </p>
      )}

      {posts?.map((post) => (
        <PostCard key={post.id} post={post} onDeleted={handleDeleted} />
      ))}

      {nextCursor && (
        <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
          {loadingMore ? 'Cargando...' : 'Cargar más'}
        </Button>
      )}
    </>
  );
}
