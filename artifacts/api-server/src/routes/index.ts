import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import notesRouter from "./notes.js";
import dilutionRouter from "./dilution.js";
import openaiRouter from "./openai/index.js";
import authRouter from "./auth.js";
import { requireAuth } from "../lib/auth.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(notesRouter);
router.use(dilutionRouter);

// All OpenAI/conversation routes require authentication
router.use(requireAuth, openaiRouter);

export default router;
