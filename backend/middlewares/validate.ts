import type { Request, Response, NextFunction } from 'express';
import type { ZodType } from 'zod';
import { BadRequestError } from '../lib/http-errors';

type Target = 'body' | 'query' | 'params';

// Middleware genérico: todo body/query/params se valida con Zod antes de llegar
// a un controller, nunca se confía en el shape de un request. Zod además
// reemplaza req[target] por el dato ya parseado/normalizado y sin campos extra.
export function validate(schema: ZodType, target: Target = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      const message = result.error.issues.map((issue) => `${issue.path.join('.') || target}: ${issue.message}`).join('; ');
      return next(new BadRequestError(message));
    }
    // req.query es getter-only en Express 5; por eso se guarda en req.validated
    // en vez de reasignar req[target] (ver types/express.d.ts).
    req.validated = { ...req.validated, [target]: result.data };
    next();
  };
}
