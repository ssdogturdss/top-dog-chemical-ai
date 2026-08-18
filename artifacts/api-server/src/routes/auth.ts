import { Router, type IRouter } from "express";
import rateLimit from "express-rate-limit";
import { getAdminPassword } from "../lib/auth.js";

const router: IRouter = Router();

// Rate-limit the login endpoint: max 10 attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts, please try again later." },
  skipSuccessfulRequests: true,
});

// GET /auth/status — check if current session is authenticated
router.get("/auth/status", (req, res): void => {
  res.json({ authenticated: req.session?.authenticated === true });
});

// POST /auth/login — log in with the admin password (rate-limited)
router.post("/auth/login", loginLimiter, (req, res): void => {
  const { password } = req.body as { password?: string };
  const adminPw = getAdminPassword();

  if (!password || !adminPw) {
    res.status(400).json({ error: "Password required" });
    return;
  }

  if (password !== adminPw) {
    res.status(401).json({ error: "Invalid password" });
    return;
  }

  req.session.authenticated = true;
  req.session.save((err) => {
    if (err) {
      res.status(500).json({ error: "Session save failed" });
      return;
    }
    res.json({ authenticated: true });
  });
});

// POST /auth/logout — clear session
router.post("/auth/logout", (req, res): void => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: "Logout failed" });
      return;
    }
    res.clearCookie("topdog.sid");
    res.json({ authenticated: false });
  });
});

export default router;
