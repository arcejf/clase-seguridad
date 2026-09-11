import { PrismaClient } from '@prisma/client';

// Singleton del cliente de Prisma: una sola conexión reutilizada en toda la
// app, en vez de instanciar un PrismaClient por request.
export const prisma = new PrismaClient();
