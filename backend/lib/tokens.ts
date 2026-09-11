import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface AccessTokenPayload {
  sub: string; // id del usuario: claim estándar (RFC 7519)
  email: string; // claim público: dato del usuario, no un secreto
  name: string; // claim público: dato del usuario, no un secreto
}

// Firmado no es lo mismo que cifrado: cualquiera puede leer este payload en
// jwt.io, así que acá nunca debería ir una contraseña ni nada realmente sensible.
//
// email y name son claims públicos: datos del usuario que el frontend necesita
// todo el tiempo para mostrar la UI, sin tener que consultar la base en cada
// request. Un `role` entraría en la misma categoría y, de hecho, es de los
// casos más típicos de claim público (se usa todo el tiempo para mostrar u
// ocultar cosas en el frontend). Este proyecto todavía no tiene roles, pero si
// los sumamos, `role` iría acá junto a los demás.

/** Access token de vida corta, con HS256 fijo (la verificación está abajo). */
export function signAccessToken(user: { id: string; email: string; displayName: string }): string {
  const payload: AccessTokenPayload = { sub: user.id, email: user.email, name: user.displayName };
  return jwt.sign(payload, env.JWT_SECRET, {
    algorithm: 'HS256', // Algoritmo de firma (hashing): HMAC con SHA256, simétrico (misma clave para firmar y verificar)
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    issuer: env.JWT_ISSUER, // Dice quien firmó el token
    audience: env.JWT_AUDIENCE, // Dice para quién es el token
  });
}

/** Tira error si la firma no cierra, si expiró, o si el issuer/audience no matchea. */
export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET, {
    algorithms: ['HS256'], // whitelist explícita, no confiar en el header del token
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
  });
  return decoded as AccessTokenPayload;
}

// El refresh token no es un JWT, es simplemente un valor aleatorio. Guardamos
// su hash (con sha256 alcanza, porque ya es aleatorio y no una contraseña
// elegida por una persona) para poder revocarlo más adelante, algo que un
// JWT firmado no permite por sí solo.

const REFRESH_TOKEN_BYTES = 64;

export function generateRefreshToken(): string {
  return crypto.randomBytes(REFRESH_TOKEN_BYTES).toString('hex');
}

export function hashRefreshToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

export function parseExpiresInToMs(expiresIn: string): number {
  const match = /^(\d+)([smhd])$/.exec(expiresIn);
  if (!match) {
    throw new Error(`Formato de expiración inválido: "${expiresIn}" (usar algo como "15m" o "7d")`);
  }
  const value = Number(match[1]);
  const unit = match[2];
  const unitMs: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return value * unitMs[unit];
}
