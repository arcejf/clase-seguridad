import type { Request, Response, NextFunction } from 'express';
import type { ZodType } from 'zod';
import { BadRequestError } from '../lib/http-errors';

type Target = 'body' | 'query' | 'params';

// Este middleware genérico valida body/query/params con Zod antes de llegar a
// un controller; nunca confiamos en la forma de un request tal como llega. Zod
// además devuelve el dato ya normalizado y sin los campos que no declaramos.
export function validate(schema: ZodType, target: Target = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      const message = result.error.issues.map((issue) => `${issue.path.join('.') || target}: ${issue.message}`).join('; ');
      return next(new BadRequestError(message));
    }
    // req.query es getter-only en Express 5, así que guardamos el resultado en
    // req.validated en vez de reasignar req[target] (ver types/express.d.ts).
    req.validated = { ...req.validated, [target]: result.data };
    next();
  };
}
