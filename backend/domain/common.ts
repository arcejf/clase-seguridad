import { z } from 'zod';

// Los ids son cuid() de Prisma, o sea strings, no números. Aun así los
// validamos acá: nunca confiamos en un :param de la URL sin pasarlo antes por
// un schema.
export const idParamSchema = z.object({
  id: z.string().min(1),
});

export const usernameParamSchema = z.object({
  username: z.string().min(1),
});
