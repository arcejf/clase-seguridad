import { PrismaClient } from '@prisma/client';

// Usamos un solo cliente de Prisma para toda la app, no uno nuevo por request.
export const prisma = new PrismaClient();
