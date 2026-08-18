import express, { type Express } from "express";
import cors from "cors";
import session from "express-session";
import pinoHttp from "pino-http";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";

// ---------------------------------------------------------------------------
// Allowed origins — exact allowlist only; no wildcard subdomains.
// Outside Replit: set FRONTEND_ORIGIN to your frontend's URL.
// In development, localhost variants are always permitted.
// ---------------------------------------------------------------------------
const FRONTEND_ORIGIN = process.env["FRONTEND_ORIGIN"];

const allowedOrigins: Set<string> = new Set([
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:23528",
]);
if (FRONTEND_ORIGIN) {
  allowedOrigins.add(FRONTEND_ORIGIN);
}

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, server-to-server health checks)
      if (!origin) return callback(null, true);
      if (allowedOrigins.has(origin)) return callback(null, true);
      return callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  }),
);

// ---------------------------------------------------------------------------
// Session — SESSION_SECRET must be set in production.
// Defaults to an insecure dev-only string when unset.
// ---------------------------------------------------------------------------
const sessionSecret = process.env["SESSION_SECRET"];
if (!sessionSecret && process.env["NODE_ENV"] === "production") {
  throw new Error("SESSION_SECRET must be set in production.");
}

app.use(
  session({
    name: "topdog.sid",
    secret: sessionSecret ?? "dev-only-insecure-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env["NODE_ENV"] === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
