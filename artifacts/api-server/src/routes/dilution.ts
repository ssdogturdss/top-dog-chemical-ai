import { Router, type IRouter } from "express";
import { eq, ilike, sql, and } from "drizzle-orm";
import { db, dilutionInjectorsTable } from "@workspace/db";
import {
  ListDilutionInjectorsQueryParams,
  LookupDilutionQueryParams,
  ReverseDilutionLookupQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

// GET /dilution
router.get("/dilution", async (req, res): Promise<void> => {
  const parsed = ListDilutionInjectorsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { brand, injectorColor } = parsed.data;
  const conditions = [];

  if (brand) conditions.push(ilike(dilutionInjectorsTable.brand, `%${brand}%`));
  if (injectorColor) conditions.push(ilike(dilutionInjectorsTable.injectorColor, `%${injectorColor}%`));

  const rows = await db
    .select()
    .from(dilutionInjectorsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(dilutionInjectorsTable.brand, dilutionInjectorsTable.ratio);

  res.json(rows);
});

// GET /dilution/brands
router.get("/dilution/brands", async (_req, res): Promise<void> => {
  const rows = await db
    .selectDistinct({ brand: dilutionInjectorsTable.brand })
    .from(dilutionInjectorsTable)
    .orderBy(dilutionInjectorsTable.brand);

  res.json(rows.map((r) => r.brand));
});

// GET /dilution/lookup
router.get("/dilution/lookup", async (req, res): Promise<void> => {
  const parsed = LookupDilutionQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { injectorColor, tipColor, brand } = parsed.data;
  const conditions = [
    ilike(dilutionInjectorsTable.injectorColor, `%${injectorColor}%`),
    ilike(dilutionInjectorsTable.tipColor, `%${tipColor}%`),
  ];

  if (brand) conditions.push(ilike(dilutionInjectorsTable.brand, `%${brand}%`));

  const rows = await db
    .select()
    .from(dilutionInjectorsTable)
    .where(and(...conditions))
    .orderBy(dilutionInjectorsTable.brand, dilutionInjectorsTable.ratio);

  res.json(rows);
});

// GET /dilution/reverse
router.get("/dilution/reverse", async (req, res): Promise<void> => {
  const parsed = ReverseDilutionLookupQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { ratio, brand, tolerance } = parsed.data;
  const tolerancePct = tolerance ?? 15;
  const minRatio = ratio * (1 - tolerancePct / 100);
  const maxRatio = ratio * (1 + tolerancePct / 100);

  const brandCondition = brand ? ilike(dilutionInjectorsTable.brand, `%${brand}%`) : undefined;

  const rows = await db
    .select()
    .from(dilutionInjectorsTable)
    .where(
      and(
        sql`${dilutionInjectorsTable.ratio}::numeric BETWEEN ${minRatio} AND ${maxRatio}`,
        brandCondition ?? sql`1=1`
      )
    )
    .orderBy(sql`ABS(${dilutionInjectorsTable.ratio}::numeric - ${ratio})`)
    .limit(20);

  res.json(rows);
});

export default router;
