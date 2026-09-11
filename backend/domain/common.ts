import { z } from 'zod';

// Los ids son cuid() de Prisma: strings, no numéricos. Igual se validan acá
// (no confiar nunca en un :param de la URL sin pasarlo por un schema).
export const idParamSchema = z.object({
  id: z.string().min(1),
});

export const usernameParamSchema = z.object({
  username: z.string().min(1),
});
