import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import * as usersApi from '@/api/users.api';
import { ApiError } from '@/lib/api-error';
import type { PublicUser } from '@/types/api';

export function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<PublicUser | null | undefined>(undefined);

  useEffect(() => {
    if (!username) return;
    usersApi
      .getPublicProfile(username)
      .then(setProfile)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) {
          setProfile(null);
        } else {
          toast.error('No se pudo cargar el perfil');
        }
      });
  }, [username]);

  if (profile === undefined) {
    return <Skeleton className="h-40 w-full" />;
  }

  if (profile === null) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <p className="text-muted-foreground">Ese usuario no existe.</p>
        <Link to="/" className="underline">
          Volver al feed
        </Link>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex items-center gap-4">
        <Avatar size="lg">
          <AvatarFallback>{profile.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="font-semibold">{profile.displayName}</h1>
          <p className="text-sm text-muted-foreground">@{profile.username}</p>
        </div>
      </CardHeader>
      <CardContent>
        {/* Este perfil viene de GET /api/users/:username, una ruta pública
            del backend (ver backend/routes/user.routes.ts). Nunca trae el
            email de esta persona: el mapper toPublicUser() (backend/domain/user.ts)
            lo excluye a propósito. Comparar con /api/auth/me, que sí incluye
            el email porque ahí el usuario está viendo sus propios datos. */}
        <p className="whitespace-pre-wrap text-sm">{profile.bio || 'Todavía no escribió una bio.'}</p>
      </CardContent>
    </Card>
  );
}
