import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../lib/http-errors';
import { isProduction } from '../config/env';

// Handler de errores centralizado: un AppError expone su mensaje (pensado para
// el cliente); cualquier otro error devuelve uno genérico y el detalle real
// (stack incluido) solo va al log, nunca a la respuesta en producción, para no
// filtrar rutas del filesystem ni versiones de librerías.
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  console.error(`[unhandled] ${req.method} ${req.path}:`, err);

  res.status(500).json({
    error: 'Ocurrió un error interno',
    ...(isProduction ? {} : { detail: err instanceof Error ? err.stack : String(err) }),
  });
}

// Rutas no encontradas, se registra después de todas las rutas conocidas.
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: `No existe ${req.method} ${req.path}` });
}
