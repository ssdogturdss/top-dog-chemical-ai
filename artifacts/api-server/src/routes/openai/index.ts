import { Router, type IRouter } from "express";
import { eq, asc } from "drizzle-orm";
import { db, conversations, messages } from "@workspace/db";
import { openai } from "@workspace/integrations-openai-ai-server";
import {
  CreateOpenaiConversationBody,
  GetOpenaiConversationParams,
  DeleteOpenaiConversationParams,
  ListOpenaiMessagesParams,
  SendOpenaiMessageParams,
  SendOpenaiMessageBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

const SYSTEM_PROMPT = `You are Top Dog Chemical AI — a professional field assistant for car wash chemical operations. You have deep expertise in:

- Chemical dilution ratios and injector systems (HydroMinder, MixRite, Dosatron, Dema, Hydro Systems, Lafferty, foaming systems, pressure washer injectors)
- Water chemistry: ORP, pH, conductivity, TDS, hardness, chlorine, alkalinity
- Equipment troubleshooting: pumps, injectors, controllers, gauges
- Safety: SDS interpretation, PPE requirements, neutralization procedures, first aid
- Car wash operations: pre-soak, rinse, foam, spot-free, tire cleaners, protectants

When asked about dilution ratios:
- State the ratio (e.g. "64:1")
- State the oz per gallon (128 ÷ ratio)
- Reference specific injector/tip colors when relevant

Always be direct, precise, and practical. Technicians are in the field — give them the answer first, then explain if needed. Never guess; if uncertain, say so and recommend testing.`;

// GET /openai/conversations
router.get("/openai/conversations", async (_req, res): Promise<void> => {
  const convs = await db
    .select()
    .from(conversations)
    .orderBy(asc(conversations.createdAt));
  res.json(convs);
});

// POST /openai/conversations
router.post("/openai/conversations", async (req, res): Promise<void> => {
  const parsed = CreateOpenaiConversationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [conv] = await db
    .insert(conversations)
    .values({ title: parsed.data.title })
    .returning();

  res.status(201).json(conv);
});

// GET /openai/conversations/:id
router.get("/openai/conversations/:id", async (req, res): Promise<void> => {
  const params = GetOpenaiConversationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [conv] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, params.data.id));

  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  const msgs = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, params.data.id))
    .orderBy(asc(messages.createdAt));

  res.json({ ...conv, messages: msgs });
});

// DELETE /openai/conversations/:id
router.delete("/openai/conversations/:id", async (req, res): Promise<void> => {
  const params = DeleteOpenaiConversationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(conversations)
    .where(eq(conversations.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  res.sendStatus(204);
});

// GET /openai/conversations/:id/messages
router.get("/openai/conversations/:id/messages", async (req, res): Promise<void> => {
  const params = ListOpenaiMessagesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const msgs = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, params.data.id))
    .orderBy(asc(messages.createdAt));

  res.json(msgs);
});

// POST /openai/conversations/:id/messages  (SSE streaming)
router.post("/openai/conversations/:id/messages", async (req, res): Promise<void> => {
  const params = SendOpenaiMessageParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = SendOpenaiMessageBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const convId = params.data.id;
  const userContent = body.data.content;

  // Save user message
  await db.insert(messages).values({
    conversationId: convId,
    role: "user",
    content: userContent,
  });

  // Load message history for context
  const history = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, convId))
    .orderBy(asc(messages.createdAt));

  const chatMessages = [
    { role: "system" as const, content: SYSTEM_PROMPT },
    ...history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let fullResponse = "";

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-5.6-luna",
      max_completion_tokens: 8192,
      messages: chatMessages,
      stream: true,
    });

    for await (const chunk of stream) {
      // Stop streaming if client disconnected
      if (res.writableEnded) break;
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        fullResponse += content;
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    if (fullResponse) {
      // Persist assistant message only when we got a response
      await db.insert(messages).values({
        conversationId: convId,
        role: "assistant",
        content: fullResponse,
      });
    }

    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "AI provider error";
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ error: errMsg })}\n\n`);
      res.end();
    }
  }
});

export default router;
