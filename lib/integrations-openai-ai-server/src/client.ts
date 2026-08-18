import OpenAI from "openai";

// Supports both the Replit AI Integration naming convention and standard OpenAI env vars.
// Outside Replit, set OPENAI_API_KEY and optionally OPENAI_BASE_URL.
// Inside Replit, AI_INTEGRATIONS_OPENAI_API_KEY and AI_INTEGRATIONS_OPENAI_BASE_URL are used.
const apiKey =
  process.env.AI_INTEGRATIONS_OPENAI_API_KEY ??
  process.env.OPENAI_API_KEY;

const baseURL =
  process.env.AI_INTEGRATIONS_OPENAI_BASE_URL ??
  process.env.OPENAI_BASE_URL;

if (!apiKey) {
  throw new Error(
    "OpenAI API key is required. Set OPENAI_API_KEY (or AI_INTEGRATIONS_OPENAI_API_KEY inside Replit).",
  );
}

export const openai = new OpenAI({
  apiKey,
  ...(baseURL ? { baseURL } : {}),
});
