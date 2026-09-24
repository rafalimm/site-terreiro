import { PrismaClient } from '@prisma/client';

// Evita criar várias instâncias do PrismaClient durante hot-reload em desenvolvimento.
declare global {
  // eslint-disable-next-line no-var
  var __prisma__: PrismaClient | undefined;
}

export const prisma = global.__prisma__ ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.__prisma__ = prisma;
}
