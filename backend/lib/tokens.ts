import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

const JWT_ISSUER = 'clase-desarrollo-seguridad-api';
const JWT_AUDIENCE = 'clase-desarrollo-seguridad-frontend';

export interface AccessTokenPayload {
  sub: string; // id del usuario
  email: string;
  name: string;
}

// Firmado ≠ cifrado: un JWT firmado garantiza INTEGRIDAD (nadie puede modificar
// el payload sin JWT_SECRET) pero no CONFIDENCIALIDAD (el payload es base64, no
// cifrado, cualquiera lo lee en jwt.io). Acá metemos email/nombre a propósito
// para que se vea clarito en la demo; por eso mismo NUNCA debe ir algo que sí
// importe que quede expuesto (passwordHash, tokens, datos sensibles, etc.).

/**
 * Firma un access token de vida corta con algoritmo fijo (HS256): nunca hay
 * que confiar en el `alg` del header de un token entrante (se fuerza también
 * al verificar, ver verifyAccessToken).
 */
export function signAccessToken(user: { id: string; email: string; displayName: string }): string {
  const payload: AccessTokenPayload = { sub: user.id, email: user.email, name: user.displayName };
  return jwt.sign(payload, env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  });
}

/**
 * Verifica un access token. Lanza si la firma no es válida, si expiró, o si
 * no coincide issuer/audience, así un token emitido para otra app (o uno
 * viejo con otro secreto) no cuela.
 */
export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET, {
    algorithms: ['HS256'], // whitelist explícita, no confiar en el header del token
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  });
  return decoded as AccessTokenPayload;
}

// --- Refresh tokens ------------------------------------------------------
// El refresh token NO es un JWT: es un valor aleatorio opaco. Solo se guarda
// su HASH (sha256 alcanza porque ya es aleatorio de 256 bits, no una contraseña
// elegida por un humano). Esto habilita revocación real: un JWT firmado no se
// puede invalidar antes de expirar, pero un refresh token sí, vía esta tabla.

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
