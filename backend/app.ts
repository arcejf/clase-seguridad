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

  // Esto es necesario para que express-rate-limit lea la IP real del cliente
  // desde X-Forwarded-For, en vez de quedarse con la IP del proxy que tenemos
  // delante en producción.
  app.set('trust proxy', 1);

  // helmet saca cabeceras que revelan información de más (como X-Powered-By) y
  // agrega otras de seguridad (X-Content-Type-Options, X-Frame-Options) que
  // ayudan contra clickjacking y sniffing de contenido.
  app.use(helmet());

  // Dejamos un único origen permitido, nunca "*": con `credentials: true` esa
  // combinación ni siquiera es legal, el navegador la rechaza directamente.
  // Esto es lo que nos permite mandar la cookie del refresh token.
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
      // CORS no solo controla quién puede pedir la respuesta, también qué puede
      // LEER el JavaScript de esa respuesta. Si no exponemos estas cabeceras, el
      // panel de seguridad no podría mostrar los valores de RateLimit-*, aunque
      // el backend los esté mandando igual.
      exposedHeaders: ['RateLimit-Policy', 'RateLimit-Limit', 'RateLimit-Remaining', 'RateLimit-Reset', 'Retry-After'],
    }),
  );

  // Limitamos el tamaño del body: sin esto, alguien podría mandar un payload
  // enorme y tirar el servidor abajo con un DoS bastante barato de hacer.
  app.use(express.json({ limit: '10kb' }));
  app.use(cookieParser());

  // Este rate limit es general, para toda la API. /auth/login y /auth/register
  // tienen uno más agresivo aparte (podés verlo en routes/auth.routes.ts).
  app.use('/api', globalRateLimit);

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.use('/api', apiRouter);

  app.use(notFoundHandler);
  // Este siempre va al final: Express lo reconoce como manejador de errores
  // porque tiene 4 parámetros (err, req, res, next).
  app.use(errorHandler);

  return app;
}
