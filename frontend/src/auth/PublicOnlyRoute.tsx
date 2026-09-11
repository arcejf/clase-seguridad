import type { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from './use-auth';

export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { status } = useAuth();

  // Mientras no sabemos si hay sesión (ver ProtectedRoute), no mostramos nada:
  // así evitamos un parpadeo de /login antes de que resuelva GET /me.
  if (status === 'loading') return null;
  // Si ya está logueado, no tiene sentido dejarlo ver /login o /register de nuevo.
  if (status === 'authenticated') return <Navigate to="/" replace />;

  return <>{children}</>;
}
