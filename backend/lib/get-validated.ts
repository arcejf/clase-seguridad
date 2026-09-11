import type { Request } from 'express';

// Esto lee lo que middlewares/validate.ts ya dejó en req.validated, tipado.
// Se usa solo en los controllers, siempre después de pasar por validate(schema).
export function getValidated<T>(req: Request, target: 'body' | 'query' | 'params'): T {
  return req.validated?.[target] as T;
}
