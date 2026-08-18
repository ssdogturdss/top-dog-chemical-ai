import type { Request, Response, NextFunction } from "express";

declare module "express-session" {
  interface SessionData {
    authenticated: boolean;
  }
}

/**
 * Middleware that gates a route behind session authentication.
 * Returns 401 JSON if the session is not authenticated.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (req.session?.authenticated) {
    next();
    return;
  }
  res.status(401).json({ error: "Authentication required" });
}

/**
 * Return the configured admin password.
 * Falls back to a safe default in development so the app starts without config.
 */
export function getAdminPassword(): string {
  const pw = process.env["ADMIN_PASSWORD"];
  if (pw && pw.length > 0) return pw;
  // No password configured — disable auth in dev by accepting any non-empty password
  return process.env["NODE_ENV"] === "production" ? "" : "topdog";
}
