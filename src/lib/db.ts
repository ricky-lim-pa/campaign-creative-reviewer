import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function ensureSettings() {
  await prisma.settings.upsert({
    where: { id: "default" },
    create: { id: "default" },
    update: {},
  });
}

export async function getSettingsBaseUrl() {
  const settings = await prisma.settings.findUnique({ where: { id: "default" } });
  return settings?.reviewBaseUrl?.trim() || "";
}
