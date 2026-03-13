"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_events_1 = require("node:events");
const app_1 = __importDefault(require("./app"));
const db_1 = require("./config/db");
const env_1 = require("./config/env");
const email_1 = require("./utils/email");
let server;
let isShuttingDown = false;
async function startServer() {
    try {
        await (0, db_1.connectDatabase)();
        // Non-blocking email configuration check so mail issues are visible early in logs.
        await (0, email_1.verifyEmailTransport)().catch((error) => {
            const msg = error instanceof Error ? error.message : String(error);
            console.warn(`[Email] SMTP verification failed at startup: ${msg}`);
        });
        server = app_1.default.listen(env_1.env.port);
        await (0, node_events_1.once)(server, "listening");
        console.info(`[Server] Listening on http://localhost:${env_1.env.port}/api/v1 (${env_1.env.nodeEnv})`);
    }
    catch (error) {
        console.error("[Server] Failed to start.", error);
        await (0, db_1.disconnectDatabase)().catch(() => undefined);
        process.exit(1);
    }
}
async function shutdown(signal, exitCode = 0) {
    if (isShuttingDown) {
        return;
    }
    isShuttingDown = true;
    console.info(`[Server] ${signal} received. Shutting down.`);
    try {
        if (server) {
            await new Promise((resolve, reject) => {
                server?.close((error) => {
                    if (error) {
                        reject(error);
                        return;
                    }
                    resolve();
                });
            });
        }
        await (0, db_1.disconnectDatabase)();
    }
    catch (error) {
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
