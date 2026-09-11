import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { apiRouter } from './routes';
import { errorHandler, notFoundHandler } from './middlewares/error-handler';
import { globalRateLimit } from './middlewares/rate-limit';

export function createApp() {
  const app = express();

  // Para que express-rate-limit lea la IP real desde X-Forwarded-For, no la del proxy.
  app.set('trust proxy', 1);

  // Elimina cabeceras que revelan info sensible (X-Powered-By) y agrega otras de
  // seguridad (X-Content-Type-Options, X-Frame-Options) contra clickjacking y sniffing.
  app.use(helmet());

  // CORS: whitelist de un único origen, no "*" ("*" + credentials no es combinación
  // legal, el navegador la bloquea). Esto permite mandar la cookie del refresh token.
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
      // CORS también controla qué puede LEER el JS de la respuesta, no solo quién
      // puede pedirla; sin exponer estas, el panel de seguridad no podría leer
      // las cabeceras RateLimit-* aunque el backend las mande.
      exposedHeaders: ['RateLimit-Policy', 'RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset', 'Retry-After'],
    }),
  );

  // Límite de tamaño del body: sin esto, un payload enorme es un vector de DoS barato.
  app.use(express.json({ limit: '10kb' }));
  app.use(cookieParser());

  // Rate limit general para toda la API; /auth/login y /auth/register
  // tienen uno más agresivo encima (ver routes/auth.routes.ts).
  app.use('/api', globalRateLimit);

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.use('/api', apiRouter);

  app.use(notFoundHandler);
  // Va SIEMPRE último: Express lo reconoce como manejador de errores por tener
  // 4 parámetros (err, req, res, next).
  app.use(errorHandler);

  return app;
}
