import { connectDatabase, disconnectDatabase } from "./config/db";

async function main(): Promise<void> {
  try {
    await connectDatabase();
    console.info("[DB] Connection successful.");
  } catch (error) {
    console.error("[DB] Connection failed.", error);
    process.exitCode = 1;
  } finally {
    await disconnectDatabase();
  }
}

void main();
