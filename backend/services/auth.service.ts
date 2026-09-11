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

  // Se guarda el HASH del refresh token, nunca el valor en claro (ver lib/tokens.ts).
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

  // Hashear ANTES de guardar: el texto plano nunca toca la base de datos.
  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      username: input.username,
      passwordHash,
      displayName: input.displayName,
    },
  });

  // Aca se genera el access token y refresh token, se guarda el hash del refresh token en BD y se devuelve todo al controller para que lo mande al cliente.
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

// Hash de bcrypt válido (de una contraseña que nadie usa) para que
// bcrypt.compare tenga el mismo costo cuando el usuario no existe.
const DUMMY_HASH_FOR_TIMING = '$2b$12$1Uh9BsrhDzktXsmkLZlB5ejomBEVoHbEtFvty.pDh4PDs2T7nU0F.';

export async function refresh(rawRefreshToken: string): Promise<AuthResult> {
  const tokenHash = hashRefreshToken(rawRefreshToken);

  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  const isValid = stored && !stored.revokedAt && stored.expiresAt > new Date();

  if (!stored || !isValid) {
    // Reuse detection: un refresh token ya usado/revocado sugiere robo (el dueño
    // legítimo ya lo rotó). Idealmente acá se revocarían todos los tokens del usuario.
    throw new UnauthorizedError('Refresh token inválido o expirado');
  }

  // Rotación: se revoca ANTES de emitir uno nuevo, es de un solo uso.
  await prisma.refreshToken.update({
    where: { id: stored.id },
    data: { revokedAt: new Date() },
  });

  const tokens = await issueTokens(stored.user);
  return { user: toAuthenticatedUser(stored.user), ...tokens };
}

const googleClient = env.GOOGLE_CLIENT_ID ? new OAuth2Client(env.GOOGLE_CLIENT_ID) : null;

// Genera un username a partir de la parte local del email, con sufijo numérico
// si ya existe (este flujo no pasa por registerSchema, así que no lo elige el usuario).
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

  // La librería verifica la firma, expiración y que "aud" coincida con nuestro
  // client ID; sin esto último, un token válido para OTRA app de Google colaría.
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
    // Puede que ya exista una cuenta con ese email creada por contraseña:
    // en ese caso vinculamos el googleId en vez de crear un duplicado.
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
  // Revocación real en BD, algo que un JWT sin estado no puede hacer solo.
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
