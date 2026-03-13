import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import routes from "./routes";
import { env } from "./config/env";
import { generalLimiter } from "./config/rateLimiter";
import { sanitizeBody } from "./middlewares/sanitize";
import { errorHandler } from "./middlewares/error.middleware";
import { requestLogger } from "./middlewares/request-logger";

const app = express();

// ── Security headers — disable crossOriginResourcePolicy so browser can load
//    cross-origin responses (required when backend and frontend run on different ports)
app.use(helmet({ crossOriginResourcePolicy: false }));

// ── CORS — credentials:true required for cookies to be sent cross-origin
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || env.allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin '${origin}' is not allowed`));
      }
    },
    credentials: true, // MUST be true for cookies to work cross-origin
  })
);

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(cookieParser()); // Parse cookies before routes

// ── Sanitize all string inputs before they reach controllers
app.use(sanitizeBody);

app.use(requestLogger);

// ── General rate limit on all API routes
app.use("/api/v1", generalLimiter);
app.use("/api/v1", routes);

app.use(errorHandler);

export default app;
