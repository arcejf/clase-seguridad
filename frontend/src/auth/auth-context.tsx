import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import * as authApi from '@/api/auth.api';
import type { RegisterPayload } from '@/api/auth.api';
import { onSessionExpired } from '@/lib/session-events';
import type { AuthenticatedUser } from '@/types/api';
import type { LoginInput } from '@/schemas/auth.schemas';
import { AuthContext, type AuthStatus } from './auth-context-object';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<AuthenticatedUser | null>(null);

  // El bootstrap (refreshSession() al montar) puede resolver después de un login
  // manual rápido; si llega tarde con 401, no debe pisar la sesión que el login
  // ya estableció. Este ref marca que el estado de auth ya se resolvió por otra vía.
  const authResolvedRef = useRef(false);

  const clearSession = useCallback(() => {
    setUser(null);
    setStatus('anonymous');
  }, []);

  useEffect(() => {
    // El access token ahora vive en una cookie httpOnly que el navegador ya
    // manda solo y que sobrevive a un F5; lo que la SPA no sabe al montar es
    // "¿hay sesión?" y "¿quién es?". GET /me responde eso. Si el access token
    // ya expiró, el 401 dispara el retry-con-refresh que ya existe en
    // apiRequest (ver lib/api-client.ts), así que la rotación del refresh
        // token sigue pasando, pero solo cuando hace falta, no en cada montaje.
    let cancelled = false;

    authApi
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
    const { user } = await authApi.login(input);
    authResolvedRef.current = true;
    setUser(user);
    setStatus('authenticated');
  }, []);

  const loginWithGoogle = useCallback(async (credential: string) => {
    const { user } = await authApi.loginWithGoogle(credential);
    authResolvedRef.current = true;
    setUser(user);
    setStatus('authenticated');
  }, []);

  const register = useCallback(async (input: RegisterPayload) => {
    const { user } = await authApi.register(input);
    authResolvedRef.current = true;
    setUser(user);
    setStatus('authenticated');
  }, []);

  const logout = useCallback(async () => {
    authResolvedRef.current = true;
    try {
      await authApi.logout();
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
