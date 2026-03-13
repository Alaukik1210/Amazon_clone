"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("./config/db");
async function main() {
    try {
        await (0, db_1.connectDatabase)();
        console.info("[DB] Connection successful.");
    }
    catch (error) {
        console.error("[DB] Connection failed.", error);
        process.exitCode = 1;
    }
    finally {
        await (0, db_1.disconnectDatabase)();
    }
}
void main();
