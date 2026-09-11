import { emitSessionExpired } from './session-events';
import { ApiError } from './api-error';
import type { AuthenticatedUser } from '@/types/api';

// Todo lo que lleva prefijo VITE_ termina DENTRO del bundle de JS (visible para
// cualquiera), nunca es secreto. Contrastar con backend/.env: JWT_SECRET nunca
// tiene default, acá sí, porque un default público no es un riesgo.
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

const REFRESH_PATH = '/api/auth/refresh';

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  /** No reintentar automáticamente con refresh ante un 401 (lo usa apiRequest, ver más abajo). Ya no afecta el envío de la cookie, eso lo controla `credentials`. */
  skipAuth?: boolean;
  /** No reintentar automáticamente con refresh ante un 401 (lo usa el panel de seguridad para mostrar el 401 crudo). */
  skipRefreshRetry?: boolean;
}

/**
 * fetch de bajo nivel: pega a la API y manda la cookie httpOnly del access
 * token sola (`credentials: 'include'` por default, overrideable por si un
 * caller puntual necesita simular "sin cookie", ver SecurityDemoPage). Ya no
 * hay Authorization que adjuntar a mano: el navegador se encarga. Devuelve el
 * Response CRUDO, sin parsear ni lanzar por status, lo usa el panel de
 * seguridad para mostrar códigos y cabeceras tal cual los manda el backend.
 */
export async function apiFetchRaw(path: string, options: RequestOptions = {}): Promise<Response> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- se excluye de `rest` a propósito, fetch no lo conoce
  const { skipAuth, skipRefreshRetry, body, headers, ...rest } = options;

  const finalHeaders = new Headers(headers);

  let finalBody: BodyInit | undefined;
  if (body !== undefined) {
    finalBody = typeof body === 'string' ? body : JSON.stringify(body);
    if (!finalHeaders.has('Content-Type')) finalHeaders.set('Content-Type', 'application/json');
  }

  return fetch(`${API_URL}${path}`, {
    ...rest,
    headers: finalHeaders,
    body: finalBody,
    // Imprescindible para que el navegador mande/reciba las cookies httpOnly
    // en un request cross-origin, aunque CORS esté bien configurado.
    credentials: options.credentials ?? 'include',
  });
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const data = await response.json();
    if (typeof data?.error === 'string') return data.error;
  } catch {
    // el body no era JSON (o estaba vacío), seguimos con el fallback
  }
  return response.statusText || `Error ${response.status}`;
}

interface RefreshResult {
  user: AuthenticatedUser;
}

// Single-flight: el backend ROTA el refresh token en cada uso, así que si dos
// llamadas a refresh salen a la vez, la segunda presenta un token ya rotado →
// 401 → cierra una sesión válida. Por eso hay UNA sola promesa compartida por
// todo el módulo (la usan tanto el reintento ante 401 como el bootstrap de
// auth-context.tsx vía refreshSession(), incluyendo el doble efecto de StrictMode).
let refreshPromise: Promise<RefreshResult> | null = null;

async function performRefresh(): Promise<RefreshResult> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const response = await apiFetchRaw(REFRESH_PATH, { method: 'POST', skipAuth: true });
      if (!response.ok) {
        emitSessionExpired();
        throw new ApiError(response.status, await readErrorMessage(response));
      }
      return (await response.json()) as RefreshResult;
    })();

    refreshPromise = refreshPromise.finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

/** Único punto de entrada para renovar la sesión, ver el comentario de arriba. */
export function refreshSession(): Promise<RefreshResult> {
  return performRefresh();
}

/**
 * fetch de alto nivel para el resto de la app: parsea JSON, lanza ApiError
 * si el status no es 2xx, y ante un 401 intenta refrescar la sesión UNA vez
 * y reintenta el request original antes de rendirse.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let response = await apiFetchRaw(path, options);

  const shouldRetry = response.status === 401 && !options.skipRefreshRetry && path !== REFRESH_PATH && !options.skipAuth;

  if (shouldRetry) {
    try {
      await performRefresh();
    } catch {
      throw new ApiError(401, 'Tu sesión expiró. Iniciá sesión de nuevo.');
    }
    response = await apiFetchRaw(path, options);
  }

  if (!response.ok) {
    throw new ApiError(response.status, await readErrorMessage(response));
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
