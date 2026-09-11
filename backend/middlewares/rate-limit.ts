import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

// Límite agresivo específico para login/register: configurable por env
// (AUTH_RATE_LIMIT_*), 5 intentos cada 15 min por default (ver config/env.ts).
export const authRateLimit = rateLimit({
  windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS,
  limit: env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Probá de nuevo en unos minutos.' },
});

// Límite general, más permisivo, para el resto de la API: corta abuso sin molestar el uso normal.
export const globalRateLimit = rateLimit({
  windowMs: env.GLOBAL_RATE_LIMIT_WINDOW_MS,
  limit: env.GLOBAL_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Probá de nuevo en unos minutos.' },
});
