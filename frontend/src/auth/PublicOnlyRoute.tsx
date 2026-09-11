import type { ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from './use-auth';

export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { status } = useAuth();

  if (status === 'loading') return null;
  if (status === 'authenticated') return <Navigate to="/" replace />;

  return <>{children}</>;
}
