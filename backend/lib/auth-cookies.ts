import type { Response } from 'express';
import { isProduction } from '../config/env';

// `path: '/api/auth'` hace que el navegador solo mande la cookie a /api/auth/*.
// El access token, en cambio, hace falta en TODAS las rutas protegidas
// (/api/posts, /api/users, etc.), así que su path es '/api'.
export const REFRESH_COOKIE_NAME = 'refreshToken';
export const ACCESS_COOKIE_NAME = 'accessToken';
const REFRESH_COOKIE_PATH = '/api/auth';
const ACCESS_COOKIE_PATH = '/api';

export function setRefreshCookie(res: Response, token: string, expiresAt: Date) {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true, // JavaScript del navegador no puede leer esta cookie, mitiga robo por XSS
    secure: isProduction, // en producción, solo se manda por HTTPS
    sameSite: 'strict', // el navegador no la manda en requests cross-site, mitiga CSRF
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

// Mismo criterio que el refresh token: HttpOnly + SameSite=Strict. Antes el
// access token viajaba en el body JSON y vivía en memoria del lado del
// frontend; ahora el navegador lo manda solo, en cada request a /api/*, sin
// que el frontend tenga que leerlo ni adjuntarlo a mano.
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
