import { emitSessionExpired } from './session-events';
import { ApiError } from './api-error';
import type { AuthenticatedUser } from '@/types/api';

// Todo lo que lleva prefijo VITE_ termina DENTRO del bundle de JS (visible para
// cualquiera), nunca es secreto. Contrastar con backend/.env: JWT_SECRET nunca
// tiene default, acá sí, porque un default público no es un riesgo.
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

const REFRESH_PATH = '/api/auth/refresh';

export interface RequestOptions extends Omit<RequestInit, 'body' | 'headers'> {
  body?: unknown;
  /** No reintentar con refresh ante un 401 (login/register: todavía no hay sesión que refrescar). */
  skipAuth?: boolean;
  /** No reintentar con refresh ante un 401 (logout: no tiene sentido revivir la sesión que se está cerrando). */
  skipRefreshRetry?: boolean;
}

/**
 * fetch de bajo nivel: manda la cookie httpOnly del access token sola
 * (`credentials: 'include'`, overrideable para simular "sin cookie" en
 * SecurityDemoPage). Devuelve el Response crudo, sin parsear ni lanzar por
 * status, para que el panel de seguridad muestre código y headers tal cual.
 */
export async function apiFetchResponse(path: string, options: RequestOptions = {}): Promise<Response> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- se excluye de `rest` a propósito, fetch no lo conoce
  const { skipAuth, skipRefreshRetry, body, ...rest } = options;

  const headers: Record<string, string> = {};
  let finalBody: BodyInit | undefined;
  if (body !== undefined) {
    finalBody = typeof body === 'string' ? body : JSON.stringify(body);
    headers['Content-Type'] = 'application/json';
  }

  return fetch(`${API_URL}${path}`, {
    ...rest,
    headers,
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

// Single-flight: el backend rota el refresh token en cada uso, así que dos
// refreshes en paralelo puden matar la sesión (el segundo llega con un token
// ya usado). Por eso hay una sola promesa compartida en todo el módulo.
let refreshPromise: Promise<RefreshResult> | null = null;

async function refreshAccessToken(): Promise<RefreshResult> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const response = await apiFetchResponse(REFRESH_PATH, { method: 'POST', skipAuth: true });
    if (!response.ok) {
      emitSessionExpired();
      throw new ApiError(response.status, await readErrorMessage(response));
    }
    return (await response.json()) as RefreshResult;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

/**
 * fetch de alto nivel para el resto de la app: parsea JSON, lanza ApiError
 * si el status no es 2xx, y ante un 401 intenta refrescar la sesión UNA vez
 * y reintenta el request original antes de rendirse.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let response = await apiFetchResponse(path, options);

  const shouldRetry = response.status === 401 && !options.skipRefreshRetry && path !== REFRESH_PATH && !options.skipAuth;

  if (shouldRetry) {
    try {
      await refreshAccessToken();
    } catch {
      throw new ApiError(401, 'Tu sesión expiró. Iniciá sesión de nuevo.');
    }
    response = await apiFetchResponse(path, options);
  }

  if (!response.ok) {
    throw new ApiError(response.status, await readErrorMessage(response));
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
