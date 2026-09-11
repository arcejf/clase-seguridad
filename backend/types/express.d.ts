// Extendemos el Request de Express con los campos que agregan nuestros
// middlewares, así tenemos autocompletado y chequeo de tipos en los
// controllers en vez de andar casteando `req as any` en todos lados.
import 'express';

declare global {
  namespace Express {
    interface Request {
      // Se setea en middlewares/require-auth.ts después de verificar el JWT.
      user?: { id: string };
      // Se setea en middlewares/validate.ts con lo que ya parseó Zod.
      validated?: {
        body?: unknown;
        query?: unknown;
        params?: unknown;
      };
    }
  }
}

export {};
