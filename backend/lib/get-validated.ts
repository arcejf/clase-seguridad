import type { Request } from 'express';

// Lee lo que middlewares/validate.ts dejó en req.validated, ya tipado.
// Solo se usa en controllers, siempre después de aplicar validate(schema).
export function getValidated<T>(req: Request, target: 'body' | 'query' | 'params'): T {
  return req.validated?.[target] as T;
}
