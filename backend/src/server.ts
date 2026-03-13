import { once } from "node:events";
import type { Server } from "node:http";
import app from "./app";
import { connectDatabase, disconnectDatabase } from "./config/db";
import { env } from "./config/env";
import { verifyEmailTransport } from "./utils/email";

let server: Server | undefined;
let isShuttingDown = false;

async function startServer(): Promise<void> {
  try {
    await connectDatabase();

    // Non-blocking email configuration check so mail issues are visible early in logs.
    await verifyEmailTransport().catch((error) => {
      const msg = error instanceof Error ? error.message : String(error);
      console.warn(`[Email] SMTP verification failed at startup: ${msg}`);
    });

    server = app.listen(env.port);
    await once(server, "listening");

    console.info(
      `[Server] Listening on http://localhost:${env.port}/api/v1 (${env.nodeEnv})`
    );
  } catch (error) {
    console.error("[Server] Failed to start.", error);
    await disconnectDatabase().catch(() => undefined);
    process.exit(1);
  }
}

async function shutdown(signal: string, exitCode = 0): Promise<void> {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  console.info(`[Server] ${signal} received. Shutting down.`);

  try {
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server?.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      });
    }

    await disconnectDatabase();
  } catch (error) {
    console.error("[Server] Shutdown failed.", error);
    process.exit(1);
  }

  process.exit(exitCode);
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

process.on("unhandledRejection", (reason) => {
  console.error("[Server] Unhandled promise rejection.", reason);
  void shutdown("unhandledRejection", 1);
});

process.on("uncaughtException", (error) => {
  console.error("[Server] Uncaught exception.", error);
  void shutdown("uncaughtException", 1);
});

void startServer();
