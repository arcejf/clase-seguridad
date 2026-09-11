import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PostCard } from '@/components/PostCard';
import { CommentList } from '@/components/CommentList';
import * as postsService from '@/services/posts';
import { ApiError } from '@/lib/api-error';
import type { PostDTO } from '@/types/api';

export function PostPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<PostDTO | null | undefined>(undefined);

  useEffect(() => {
    if (!id) return;
    postsService
      .getPost(id)
      .then(setPost)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) {
          setPost(null);
        } else {
          toast.error('No se pudo cargar el post');
        }
      });
  }, [id]);

  function handleDeleted() {
    navigate('/', { replace: true });
  }

  if (post === undefined) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (post === null) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <p className="text-muted-foreground">Este post no existe (o ya lo borraron).</p>
        <Link to="/" className="underline">
          Volver al feed
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Link to="/" className="flex items-center gap-1 text-sm text-muted-foreground hover:underline">
        <ArrowLeft className="size-4" /> Volver al feed
      </Link>

      <PostCard post={post} linkToDetail={false} onDeleted={handleDeleted} />

      <Card className="py-4">
        <CardContent className="px-4">
          <CommentList postId={post.id} postAuthorId={post.author.id} />
        </CardContent>
      </Card>
    </div>
  );
}
