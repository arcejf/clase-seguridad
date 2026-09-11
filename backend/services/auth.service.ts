import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../lib/prisma';
import { hashPassword, verifyPassword } from '../lib/password';
import {
  signAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  parseExpiresInToMs,
} from '../lib/tokens';
import { ConflictError, UnauthorizedError } from '../lib/http-errors';
import { toAuthenticatedUser, type AuthenticatedUser, type RegisterInput, type LoginInput } from '../domain/user';
import { env } from '../config/env';

export interface AuthResult {
  user: AuthenticatedUser;
  accessToken: string;
  accessTokenExpiresAt: Date;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

async function issueTokens(user: { id: string; email: string; displayName: string }): Promise<{
  accessToken: string;
  accessTokenExpiresAt: Date;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}> {
  const accessToken = signAccessToken(user);
  const accessTokenExpiresAt = new Date(Date.now() + parseExpiresInToMs(env.JWT_ACCESS_EXPIRES_IN));

  const refreshToken = generateRefreshToken();
  const refreshTokenExpiresAt = new Date(Date.now() + parseExpiresInToMs(env.JWT_REFRESH_EXPIRES_IN));

  // Guardamos el hash del refresh token, nunca el valor en claro (ver lib/tokens.ts).
  await prisma.refreshToken.create({
    data: {
      tokenHash: hashRefreshToken(refreshToken),
      userId: user.id,
      expiresAt: refreshTokenExpiresAt,
    },
  });

  return { accessToken, accessTokenExpiresAt, refreshToken, refreshTokenExpiresAt };
}

export async function register(input: RegisterInput): Promise<AuthResult> {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: input.email }, { username: input.username }] },
  });
  if (existing) {
    throw new ConflictError(
      existing.email === input.email ? 'Ese email ya está registrado' : 'Ese nombre de usuario ya está en uso',
    );
  }

  // Hasheamos antes de guardar, así el texto plano nunca toca la base de datos.
  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      username: input.username,
      passwordHash,
      displayName: input.displayName,
    },
  });

  const tokens = await issueTokens(user);
  return { user: toAuthenticatedUser(user), ...tokens };
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  const passwordHash = user?.passwordHash ?? DUMMY_HASH_FOR_TIMING;
  const passwordMatches = await verifyPassword(input.password, passwordHash);

  if (!user || !passwordMatches) {
    throw new UnauthorizedError('Email o contraseña incorrectos');
  }

  const tokens = await issueTokens(user);
  return { user: toAuthenticatedUser(user), ...tokens };
}

// Este es un hash de bcrypt válido de una contraseña que no usa nadie. Lo
// usamos para que bcrypt.compare tarde lo mismo aunque el usuario ni siquiera
// exista, y así no delatar por el tiempo de respuesta si un email está registrado.
const DUMMY_HASH_FOR_TIMING = '$2b$12$1Uh9BsrhDzktXsmkLZlB5ejomBEVoHbEtFvty.pDh4PDs2T7nU0F.';

export async function refresh(rawRefreshToken: string): Promise<AuthResult> {
  const tokenHash = hashRefreshToken(rawRefreshToken);

  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  const isValid = stored && !stored.revokedAt && stored.expiresAt > new Date();

  if (!stored || !isValid) {
    // Si llega un refresh token ya usado o revocado, es una señal de que puede
    // haber sido robado (el dueño legítimo ya lo rotó). Lo ideal en ese caso
    // sería revocar todos los tokens de ese usuario, no solo este.
    throw new UnauthorizedError('Refresh token inválido o expirado');
  }

  // Lo revocamos antes de emitir uno nuevo: cada refresh token sirve una sola vez.
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  const tokens = await issueTokens(stored.user);
  return { user: toAuthenticatedUser(stored.user), ...tokens };
}

const googleClient = env.GOOGLE_CLIENT_ID ? new OAuth2Client(env.GOOGLE_CLIENT_ID) : null;

// Armamos un username a partir de la parte local del email, con un sufijo
// numérico si ya existe. Este flujo no pasa por registerSchema, así que la
// persona no lo elige.
async function uniqueUsernameFromEmail(email: string): Promise<string> {
  const base = email
    .split('@')[0]
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 25) || 'usuario';

  let candidate = base;
  let suffix = 1;
  while (await prisma.user.findUnique({ where: { username: candidate } })) {
    candidate = `${base}${suffix}`;
    suffix += 1;
  }
  return candidate;
}

export async function loginWithGoogle(rawIdToken: string): Promise<AuthResult> {
  if (!googleClient) {
    throw new UnauthorizedError('El login con Google no está configurado en este servidor');
  }

  // La librería se encarga de verificar la firma, que no haya expirado, y que el
  // "aud" coincida con nuestro client ID. Sin este último chequeo, cualquier token
  // válido de OTRA app de Google también pasaría acá.
  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: rawIdToken,
      audience: env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch {
    throw new UnauthorizedError('Token de Google inválido');
  }

  if (!payload?.sub || !payload.email) {
    throw new UnauthorizedError('Token de Google inválido');
  }
  if (!payload.email_verified) {
    throw new UnauthorizedError('Ese email de Google todavía no está verificado');
  }

  const email = payload.email.toLowerCase();

  let user = await prisma.user.findUnique({ where: { googleId: payload.sub } });

  if (!user) {
    // Puede que ya haya una cuenta con ese email creada por contraseña. En ese
    // caso vinculamos el googleId a esa cuenta en vez de crear una duplicada.
    const existingByEmail = await prisma.user.findUnique({ where: { email } });
    if (existingByEmail) {
      user = await prisma.user.update({
        where: { id: existingByEmail.id },
        data: { googleId: payload.sub },
      });
    } else {
      const username = await uniqueUsernameFromEmail(email);
      user = await prisma.user.create({
        data: {
          email,
          username,
          googleId: payload.sub,
          displayName: payload.name ?? username,
          passwordHash: null,
        },
      });
    }
  }

  const tokens = await issueTokens(user);
  return { user: toAuthenticatedUser(user), ...tokens };
}

export async function logout(rawRefreshToken: string): Promise<void> {
  const tokenHash = hashRefreshToken(rawRefreshToken);
  // Esto es revocación de verdad, guardada en la base, algo que un JWT por sí
  // solo no puede lograr.
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
