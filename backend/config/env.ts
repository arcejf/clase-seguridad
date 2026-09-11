import { config as loadDotenv } from 'dotenv';
import { z } from 'zod';

// `quiet: true` apaga los mensajes promocionales que dotenv imprime por
// consola en cada arranque (inofensivos, pero ruido de más en una demo).
loadDotenv({ quiet: true });

// Validar env al arrancar, no con process.env.X disperso: si falta una variable
// crítica o es débil (JWT_SECRET corto), el proceso NO arranca. Un default
// silencioso e inseguro es peor que un crash temprano y explícito.
const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL es obligatoria'),
  CORS_ORIGIN: z.string().min(1, 'CORS_ORIGIN es obligatoria'),
  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET debe tener al menos 32 caracteres (correr `npm run setup` genera uno válido)'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  JWT_ISSUER: z.string().default('localhost:3000'),
  JWT_AUDIENCE: z.string().default('localhost:5173'),

  // Defaults = valores estrictos de producción; subirlos solo por env var, nunca
  // hardcodeando en el código, para que una excepción de demo quede explícita.
  AUTH_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(5),
  GLOBAL_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
  GLOBAL_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),

  // A diferencia de JWT_SECRET, opcional: sin configurar, POST /api/auth/google
  // responde 503 pero el resto de la API sigue funcionando (ver auth.controller.ts).
  GOOGLE_CLIENT_ID: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Variables de entorno inválidas o faltantes:');
  for (const issue of parsed.error.issues) {
    console.error(`   - ${issue.path.join('.')}: ${issue.message}`);
  }
  console.error('\n¿Corriste `npm run setup`? Eso crea el .env con un JWT_SECRET válido.');
  process.exit(1);
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === 'production';
