import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "./env";

// Prisma 7 requires a driver adapter — PrismaPg connects to PostgreSQL
const adapter = new PrismaPg({ connectionString: env.databaseUrl });

const prisma = new PrismaClient({
  adapter,
  log: env.nodeEnv === "development" ? ["warn", "error"] : ["error"],
});

export async function connectDatabase(): Promise<void> {
  await prisma.$connect();
  await prisma.$queryRaw`SELECT 1`;
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}

export default prisma;
