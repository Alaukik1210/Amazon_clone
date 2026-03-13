"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDatabase = connectDatabase;
exports.disconnectDatabase = disconnectDatabase;
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const env_1 = require("./env");
// Prisma 7 requires a driver adapter — PrismaPg connects to PostgreSQL
const adapter = new adapter_pg_1.PrismaPg({ connectionString: env_1.env.databaseUrl });
const prisma = new client_1.PrismaClient({
    adapter,
    log: env_1.env.nodeEnv === "development" ? ["warn", "error"] : ["error"],
});
async function connectDatabase() {
    await prisma.$connect();
    await prisma.$queryRaw `SELECT 1`;
}
async function disconnectDatabase() {
    await prisma.$disconnect();
}
exports.default = prisma;
