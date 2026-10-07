import { PrismaClient } from "@prisma/client";

/**
 * Um client só por processo — no `react-router dev` o módulo recarrega a cada
 * edição, e sem o cache no globalThis cada recarga abriria um pool novo.
 */
const globalParaPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalParaPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalParaPrisma.prisma = db;
