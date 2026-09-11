import { useState } from 'react';
import { Link } from 'react-router';
import { Heart, MessageCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/auth/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import * as postsService from '@/services/posts';
import { ApiError } from '@/lib/api-error';
import type { PostDTO } from '@/types/api';

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'ahora';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

interface PostCardProps {
  post: PostDTO;
  linkToDetail?: boolean;
  onDeleted?: (postId: string) => void;
}

export function PostCard({ post, linkToDetail = true, onDeleted }: PostCardProps) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(post.likedByCurrentUser);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [busy, setBusy] = useState(false);

  // Mostrar este botón solo en posts propios es UX, no control de acceso: lo
  // que bloquea el borrado ajeno de verdad es el chequeo de ownership en
  // backend/services/post.service.ts.
  const isOwnPost = user?.id === post.author.id;

  async function toggleLike() {
    if (busy) return;
    setBusy(true);
    try {
      const result = liked ? await postsService.unlikePost(post.id) : await postsService.likePost(post.id);
      setLiked(!liked);
      setLikeCount(result.likeCount);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'No se pudo actualizar el like');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (busy) return;
    setBusy(true);
    try {
      await postsService.deletePost(post.id);
      toast.success('Post borrado');
      onDeleted?.(post.id);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'No se pudo borrar el post');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="gap-3 py-4">
      <CardHeader className="flex items-center gap-3 px-4">
        <Link to={`/u/${post.author.username}`} onClick={(e) => e.stopPropagation()}>
          <Avatar>
            <AvatarFallback>{post.author.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex min-w-0 flex-col">
          <Link
            to={`/u/${post.author.username}`}
            onClick={(e) => e.stopPropagation()}
            className="truncate text-sm font-medium hover:underline"
          >
            {post.author.displayName}
          </Link>
          <span className="text-xs text-muted-foreground">
            @{post.author.username} · {timeAgo(post.createdAt)}
          </span>
        </div>
      </CardHeader>

      <CardContent className="px-4">
        {/* React escapa esta interpolación por default: content es texto, nunca
            HTML, protección anti-XSS. dangerouslySetInnerHTML rompería eso. */}
        <p className="whitespace-pre-wrap break-words text-sm">{post.content}</p>
      </CardContent>

      <CardFooter className="gap-4 px-4">
        <Button variant="ghost" size="sm" onClick={toggleLike} disabled={busy} className="gap-1.5">
          <Heart className={liked ? 'size-4 fill-current text-red-500' : 'size-4'} />
          {likeCount}
        </Button>

        {linkToDetail ? (
          <Button variant="ghost" size="sm" className="gap-1.5" asChild>
            <Link to={`/post/${post.id}`}>
              <MessageCircle className="size-4" />
              {post.commentCount}
            </Link>
          </Button>
        ) : (
          <span className="flex items-center gap-1.5 px-3 text-sm text-muted-foreground">
            <MessageCircle className="size-4" />
            {post.commentCount}
          </span>
        )}

        {isOwnPost && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto gap-1.5 text-muted-foreground hover:text-destructive"
            onClick={handleDelete}
            disabled={busy}
            aria-label="Borrar post"
          >
            <Trash2 className="size-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
