import { Router, type IRouter } from "express";
import { eq, ilike, desc, or, and, count, sql } from "drizzle-orm";
import { db, notesTable } from "@workspace/db";
import {
  ListNotesQueryParams,
  CreateNoteBody,
  GetNoteParams,
  UpdateNoteParams,
  UpdateNoteBody,
  DeleteNoteParams,
  ToggleNotePinParams,
  GetRecentNotesQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

// GET /notes
router.get("/notes", async (req, res): Promise<void> => {
  const parsed = ListNotesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { search, category, pinned } = parsed.data;

  const conditions = [];

  if (search) {
    conditions.push(
      or(
        ilike(notesTable.title, `%${search}%`),
        ilike(notesTable.content, `%${search}%`)
      )
    );
  }

  if (category) {
    conditions.push(eq(notesTable.category, category));
  }

  if (pinned !== undefined) {
    conditions.push(eq(notesTable.pinned, pinned === "true"));
  }

  const notes = await db
    .select()
    .from(notesTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(notesTable.pinned), desc(notesTable.updatedAt));

  res.json(notes);
});

// POST /notes
router.post("/notes", async (req, res): Promise<void> => {
  const parsed = CreateNoteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { title, content, category } = parsed.data;

  const [note] = await db
    .insert(notesTable)
    .values({
      title,
      content: content ?? "",
      category: category ?? "General",
    })
    .returning();

  res.status(201).json(note);
});

// GET /notes/stats
router.get("/notes/stats", async (_req, res): Promise<void> => {
  const [totals] = await db
    .select({
      total: count(),
      pinned: sql<number>`count(*) filter (where ${notesTable.pinned} = true)`,
    })
    .from(notesTable);

  const categories = await db
    .select({
      category: notesTable.category,
      count: count(),
    })
    .from(notesTable)
    .groupBy(notesTable.category)
    .orderBy(desc(count()));

  res.json({
    total: Number(totals?.total ?? 0),
    pinned: Number(totals?.pinned ?? 0),
    categories: categories.map((c) => ({
      category: c.category,
      count: Number(c.count),
    })),
  });
});

// GET /notes/recent
router.get("/notes/recent", async (req, res): Promise<void> => {
  const parsed = GetRecentNotesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const limit = Math.min(parsed.data.limit ?? 5, 20);

  const notes = await db
    .select()
    .from(notesTable)
    .orderBy(desc(notesTable.updatedAt))
    .limit(limit);

  res.json(notes);
});

// GET /notes/:id
router.get("/notes/:id", async (req, res): Promise<void> => {
  const params = GetNoteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [note] = await db
    .select()
    .from(notesTable)
    .where(eq(notesTable.id, params.data.id));

  if (!note) {
    res.status(404).json({ error: "Note not found" });
    return;
  }

  res.json(note);
});

// PATCH /notes/:id
router.patch("/notes/:id", async (req, res): Promise<void> => {
  const params = UpdateNoteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateNoteBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Partial<typeof notesTable.$inferInsert> = {};
  if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
  if (parsed.data.content !== undefined) updateData.content = parsed.data.content;
  if (parsed.data.category !== undefined) updateData.category = parsed.data.category;

  const [note] = await db
    .update(notesTable)
    .set(updateData)
    .where(eq(notesTable.id, params.data.id))
    .returning();

  if (!note) {
    res.status(404).json({ error: "Note not found" });
    return;
  }

  res.json(note);
});

// DELETE /notes/:id
router.delete("/notes/:id", async (req, res): Promise<void> => {
  const params = DeleteNoteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [note] = await db
    .delete(notesTable)
    .where(eq(notesTable.id, params.data.id))
    .returning();

  if (!note) {
    res.status(404).json({ error: "Note not found" });
    return;
  }

  res.sendStatus(204);
});

// PATCH /notes/:id/pin
router.patch("/notes/:id/pin", async (req, res): Promise<void> => {
  const params = ToggleNotePinParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(notesTable)
    .where(eq(notesTable.id, params.data.id));

  if (!existing) {
    res.status(404).json({ error: "Note not found" });
    return;
  }

  const [note] = await db
    .update(notesTable)
    .set({ pinned: !existing.pinned })
    .where(eq(notesTable.id, params.data.id))
    .returning();

  res.json(note);
});

export default router;
