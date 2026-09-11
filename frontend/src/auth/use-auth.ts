import { useContext } from 'react';
import { AuthContext } from './auth-context';

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth tiene que usarse dentro de <AuthProvider>');
  return ctx;
}
