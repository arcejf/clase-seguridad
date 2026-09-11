import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from './use-auth';
import { Skeleton } from '@/components/ui/skeleton';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    // No redirigir todavía: si lo hiciéramos, cualquier F5 mandaría a /login
    // un instante antes de que responda /auth/refresh, aunque la sesión sea válida.
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-6">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (status === 'anonymous') {
    // Guarda la ruta de origen para que LoginPage devuelva ahí después de loguearse.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
