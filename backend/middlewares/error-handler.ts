import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../lib/http-errors';
import { isProduction } from '../config/env';

// Centralizamos acá el manejo de errores: un AppError expone su mensaje,
// pensado para mostrarse al cliente. Cualquier otro error devuelve un mensaje
// genérico; el detalle real (con el stack) solo va al log, nunca a la
// respuesta en producción, para no filtrar rutas del filesystem ni versiones
// de librerías.
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

// Este se registra después de todas las rutas conocidas, para capturar el resto.
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: `No existe ${req.method} ${req.path}` });
}
