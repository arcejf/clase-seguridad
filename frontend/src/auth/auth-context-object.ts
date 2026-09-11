import { createContext } from 'react';
import type { RegisterPayload } from '@/api/auth.api';
import type { AuthenticatedUser } from '@/types/api';
import type { LoginInput } from '@/schemas/auth.schemas';

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

export interface AuthContextValue {
  status: AuthStatus;
  user: AuthenticatedUser | null;
  login: (input: LoginInput) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  register: (input: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: AuthenticatedUser) => void;
}

// Separado de auth-context.tsx (que solo exporta el componente AuthProvider)
// porque react-refresh/fast-refresh exige que un archivo de componentes
// exporte únicamente componentes: si no, el hot-reload de Vite pierde el
// estado en cada cambio.
export const AuthContext = createContext<AuthContextValue | null>(null);
