import type { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service';
import * as userService from '../services/user.service';
import { getValidated } from '../lib/get-validated';
import {
  setRefreshCookie,
  clearRefreshCookie,
  setAccessCookie,
  clearAccessCookie,
  REFRESH_COOKIE_NAME,
} from '../lib/auth-cookies';
import { UnauthorizedError } from '../lib/http-errors';
import { env } from '../config/env';
import type { RegisterInput, LoginInput, GoogleLoginInput } from '../domain/user';

// Los controllers solo traducen HTTP <-> servicio; ninguna regla de negocio
// (hashing, ownership, revocación) vive acá, eso está en services/.

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const input = getValidated<RegisterInput>(req, 'body');
    const result = await authService.register(input);
    setRefreshCookie(res, result.refreshToken, result.refreshTokenExpiresAt);
    setAccessCookie(res, result.accessToken, result.accessTokenExpiresAt);
    res.status(201).json({ user: result.user });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const input = getValidated<LoginInput>(req, 'body');
    const result = await authService.login(input);
    setRefreshCookie(res, result.refreshToken, result.refreshTokenExpiresAt);
    setAccessCookie(res, result.accessToken, result.accessTokenExpiresAt);
    res.status(200).json({ user: result.user });
  } catch (err) {
    next(err);
  }
}

export async function google(req: Request, res: Response, next: NextFunction) {
  try {
    if (!env.GOOGLE_CLIENT_ID) {
      res.status(503).json({ error: 'El login con Google no está configurado en este servidor' });
      return;
    }
    const input = getValidated<GoogleLoginInput>(req, 'body');
    const result = await authService.loginWithGoogle(input.credential);
    setRefreshCookie(res, result.refreshToken, result.refreshTokenExpiresAt);
    setAccessCookie(res, result.accessToken, result.accessTokenExpiresAt);
    res.status(200).json({ user: result.user });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const rawRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!rawRefreshToken) throw new UnauthorizedError('Falta el refresh token');

    const result = await authService.refresh(rawRefreshToken);
    setRefreshCookie(res, result.refreshToken, result.refreshTokenExpiresAt);
    setAccessCookie(res, result.accessToken, result.accessTokenExpiresAt);
    res.status(200).json({ user: result.user });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const rawRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (rawRefreshToken) {
      await authService.logout(rawRefreshToken);
    }
    clearRefreshCookie(res);
    clearAccessCookie(res);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    // req.user viene de requireAuth, nunca undefined en esta ruta.
    const user = await userService.getAuthenticatedUser(req.user!.id);
    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
}
