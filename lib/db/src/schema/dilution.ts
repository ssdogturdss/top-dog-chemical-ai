import { pgTable, text, serial, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const dilutionInjectorsTable = pgTable("dilution_injectors", {
  id: serial("id").primaryKey(),
  brand: text("brand").notNull(),
  injectorColor: text("injector_color").notNull(),
  tipColor: text("tip_color").notNull(),
  ratio: numeric("ratio", { precision: 10, scale: 2 }).notNull(),
  gpm: numeric("gpm", { precision: 6, scale: 2 }).notNull(),
  ozPerGallon: numeric("oz_per_gallon", { precision: 8, scale: 3 }).notNull(),
  notes: text("notes"),
});

export const insertDilutionInjectorSchema = createInsertSchema(dilutionInjectorsTable).omit({
  id: true,
});

export type InsertDilutionInjector = z.infer<typeof insertDilutionInjectorSchema>;
export type DilutionInjector = typeof dilutionInjectorsTable.$inferSelect;
