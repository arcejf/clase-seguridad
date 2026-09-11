import type { Response } from 'express';
import { isProduction } from '../config/env';

// Con `path: '/api/auth'` el navegador solo manda esta cookie a /api/auth/*.
// El access token en cambio hace falta en todas las rutas protegidas
// (/api/posts, /api/users, etc.), por eso su path es '/api' directamente.
export const REFRESH_COOKIE_NAME = 'refreshToken';
export const ACCESS_COOKIE_NAME = 'accessToken';
const REFRESH_COOKIE_PATH = '/api/auth';
const ACCESS_COOKIE_PATH = '/api';

export function setRefreshCookie(res: Response, token: string, expiresAt: Date) {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true, // así ningún script del navegador puede leerla, aunque haya XSS
    secure: isProduction, // en producción solo se manda por HTTPS
    sameSite: 'strict', // no viaja en requests cross-site, así mitiga CSRF
    path: REFRESH_COOKIE_PATH,
    expires: expiresAt,
  });
}

export function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: REFRESH_COOKIE_PATH,
  });
}

// Usamos el mismo criterio que con el refresh: HttpOnly + SameSite=Strict. Así
// el navegador manda el access token solo en cada request a /api/*, sin que el
// frontend tenga que leerlo ni adjuntarlo a mano.
export function setAccessCookie(res: Response, token: string, expiresAt: Date) {
  res.cookie(ACCESS_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: ACCESS_COOKIE_PATH,
    expires: expiresAt,
  });
}

export function clearAccessCookie(res: Response) {
  res.clearCookie(ACCESS_COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: ACCESS_COOKIE_PATH,
  });
}
