import { createContext, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import * as authService from '@/services/auth';
import type { RegisterPayload } from '@/services/auth';
import { onSessionExpired } from '@/lib/session-events';
import type { AuthenticatedUser } from '@/types/api';
import type { LoginInput } from '@/schemas/auth';

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

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<AuthenticatedUser | null>(null);

  // El bootstrap (getMe() al montar, con su posible retry-con-refresh) puede
  // resolver después de un login manual rápido; si llega tarde con 401, no debe
  // pisar la sesión que el login ya estableció. Este ref marca que el estado de
  // auth ya se resolvió por otra vía.
  const authResolvedRef = useRef(false);

  const clearSession = useCallback(() => {
    setUser(null);
    setStatus('anonymous');
  }, []);

  useEffect(() => {
    // Al montar no sabemos si hay sesión: la cookie httpOnly sobrevive a un F5
    // pero la SPA no puede leerla. GET /me lo resuelve, y si el access token
    // ya expiró, el 401 dispara el retry-con-refresh de apiRequest solo.
    let cancelled = false;

    authService
      .getMe()
      .then((user) => {
        if (cancelled || authResolvedRef.current) return;
        authResolvedRef.current = true;
        setUser(user);
        setStatus('authenticated');
      })
      .catch(() => {
        if (cancelled || authResolvedRef.current) return;
        authResolvedRef.current = true;
        clearSession();
      });

    return () => {
      cancelled = true;
    };
  }, [clearSession]);

  useEffect(() => {
    // Avisa cuando api-client.ts intenta renovar la sesión y falla, así la UI
    // no sigue creyendo que hay sesión activa hasta el próximo request.
    return onSessionExpired(clearSession);
  }, [clearSession]);

  const login = useCallback(async (input: LoginInput) => {
    const { user } = await authService.login(input);
    authResolvedRef.current = true;
    setUser(user);
    setStatus('authenticated');
  }, []);

  const loginWithGoogle = useCallback(async (credential: string) => {
    const { user } = await authService.loginWithGoogle(credential);
    authResolvedRef.current = true;
    setUser(user);
    setStatus('authenticated');
  }, []);

  const register = useCallback(async (input: RegisterPayload) => {
    const { user } = await authService.register(input);
    authResolvedRef.current = true;
    setUser(user);
    setStatus('authenticated');
  }, []);

  const logout = useCallback(async () => {
    authResolvedRef.current = true;
    try {
      await authService.logout();
    } finally {
      // La sesión se limpia del lado cliente pase lo que pase con el request.
      clearSession();
    }
  }, [clearSession]);

  return (
    <AuthContext.Provider value={{ status, user, login, loginWithGoogle, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}
