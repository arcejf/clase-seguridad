import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../lib/tokens';
import { UnauthorizedError } from '../lib/http-errors';
import { ACCESS_COOKIE_NAME } from '../lib/auth-cookies';

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[ACCESS_COOKIE_NAME];
  if (!token) {
    return next(new UnauthorizedError('Falta el token de autenticación'));
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub };
    next();
  } catch {
    next(new UnauthorizedError('Token inválido o expirado'));
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[ACCESS_COOKIE_NAME];
  if (token) {
    try {
      const payload = verifyAccessToken(token);
      req.user = { id: payload.sub };
    } catch {
      // ignorado
    }
  }
  next();
}
