import { PrismaClient } from '@prisma/client';
// Ensure a single PrismaClient instance in dev with hot reloads
const globalForPrisma = globalThis;
export const prisma = globalForPrisma.prisma ??
    new PrismaClient({
        log: ['error', 'warn'],
    });
if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}
//# sourceMappingURL=prisma.js.map