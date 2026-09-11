// Extiende el tipo Request de Express con los campos que agregan nuestros
// middlewares, para tener autocompletado/chequeo de tipos en los controllers
// en vez de castear `req as any` en todos lados.
import 'express';

declare global {
  namespace Express {
    interface Request {
      // Seteado por middlewares/require-auth.ts tras verificar el JWT.
      user?: { id: string };
      // Seteado por middlewares/validate.ts con el resultado ya parseado por Zod.
      validated?: {
        body?: unknown;
        query?: unknown;
        params?: unknown;
      };
    }
  }
}

export {};
