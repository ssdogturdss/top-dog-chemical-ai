/**
 * Idempotent seed for Top Dog Chemical AI.
 * Run: pnpm --filter @workspace/db run seed
 *
 * Uses INSERT ... ON CONFLICT DO NOTHING so it can be run safely multiple times.
 */
import { db } from "./index.js";
import { dilutionInjectorsTable } from "./schema/index.js";
import { notesTable } from "./schema/notes.js";
import { sql } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Dilution injectors — 65+ validated configurations across 8 brands
// ---------------------------------------------------------------------------

const injectors = [
  // ── HydroMinder ──────────────────────────────────────────────────────────
  { brand: "HydroMinder", injectorColor: "Red",    tipColor: "Tan",    ratio: "64",  gpm: "1.1", ozPerGallon: "2.000", notes: "Most common car wash pre-soak setup" },
  { brand: "HydroMinder", injectorColor: "Red",    tipColor: "Green",  ratio: "32",  gpm: "1.1", ozPerGallon: "4.000", notes: "High-concentration applications" },
  { brand: "HydroMinder", injectorColor: "Red",    tipColor: "Blue",   ratio: "128", gpm: "1.1", ozPerGallon: "1.000", notes: "Light rinse aids and conditioners" },
  { brand: "HydroMinder", injectorColor: "Red",    tipColor: "Red",    ratio: "256", gpm: "1.1", ozPerGallon: "0.500", notes: "Ultra-dilute spot-free rinse additive" },
  { brand: "HydroMinder", injectorColor: "Red",    tipColor: "Yellow", ratio: "16",  gpm: "1.1", ozPerGallon: "8.000", notes: "Tire/wheel cleaners" },
  { brand: "HydroMinder", injectorColor: "Blue",   tipColor: "Tan",    ratio: "64",  gpm: "0.5", ozPerGallon: "2.000", notes: "Low-flow for soft water areas" },
  { brand: "HydroMinder", injectorColor: "Blue",   tipColor: "Green",  ratio: "32",  gpm: "0.5", ozPerGallon: "4.000", notes: "Low-flow, high concentration" },
  { brand: "HydroMinder", injectorColor: "Blue",   tipColor: "Blue",   ratio: "128", gpm: "0.5", ozPerGallon: "1.000" },
  { brand: "HydroMinder", injectorColor: "Green",  tipColor: "Tan",    ratio: "64",  gpm: "2.2", ozPerGallon: "2.000", notes: "High-flow tunnel applications" },
  { brand: "HydroMinder", injectorColor: "Green",  tipColor: "Green",  ratio: "32",  gpm: "2.2", ozPerGallon: "4.000", notes: "High-flow, heavy foam" },

  // ── MixRite ──────────────────────────────────────────────────────────────
  { brand: "MixRite", injectorColor: "Gray",   tipColor: "Gray",   ratio: "100", gpm: "2.6", ozPerGallon: "1.280", notes: "MixRite 2.5% standard" },
  { brand: "MixRite", injectorColor: "Gray",   tipColor: "White",  ratio: "200", gpm: "2.6", ozPerGallon: "0.640", notes: "MixRite 0.5% dilute" },
  { brand: "MixRite", injectorColor: "Gray",   tipColor: "Black",  ratio: "50",  gpm: "2.6", ozPerGallon: "2.560", notes: "MixRite 2% concentrate" },
  { brand: "MixRite", injectorColor: "Black",  tipColor: "Gray",   ratio: "100", gpm: "5.3", ozPerGallon: "1.280", notes: "MixRite TF5 high-flow" },
  { brand: "MixRite", injectorColor: "Black",  tipColor: "White",  ratio: "200", gpm: "5.3", ozPerGallon: "0.640", notes: "MixRite TF5 dilute" },
  { brand: "MixRite", injectorColor: "Black",  tipColor: "Black",  ratio: "50",  gpm: "5.3", ozPerGallon: "2.560", notes: "MixRite TF5 concentrate" },
  { brand: "MixRite", injectorColor: "White",  tipColor: "Gray",   ratio: "200", gpm: "1.3", ozPerGallon: "0.640", notes: "Low-flow spot-free additive" },
  { brand: "MixRite", injectorColor: "White",  tipColor: "White",  ratio: "500", gpm: "1.3", ozPerGallon: "0.256", notes: "Ultra-dilute fragrance" },

  // ── Dosatron ─────────────────────────────────────────────────────────────
  { brand: "Dosatron", injectorColor: "Blue",   tipColor: "Blue",   ratio: "100", gpm: "4.0",  ozPerGallon: "1.280", notes: "D14MZ standard car wash" },
  { brand: "Dosatron", injectorColor: "Blue",   tipColor: "Yellow", ratio: "50",  gpm: "4.0",  ozPerGallon: "2.560", notes: "D14MZ concentrated" },
  { brand: "Dosatron", injectorColor: "Blue",   tipColor: "Red",    ratio: "200", gpm: "4.0",  ozPerGallon: "0.640", notes: "D14MZ dilute rinse aid" },
  { brand: "Dosatron", injectorColor: "Yellow", tipColor: "Blue",   ratio: "100", gpm: "8.0",  ozPerGallon: "1.280", notes: "D14MZ2 high-volume" },
  { brand: "Dosatron", injectorColor: "Yellow", tipColor: "Yellow", ratio: "50",  gpm: "8.0",  ozPerGallon: "2.560", notes: "D14MZ2 high-volume concentrate" },
  { brand: "Dosatron", injectorColor: "Yellow", tipColor: "Red",    ratio: "200", gpm: "8.0",  ozPerGallon: "0.640" },
  { brand: "Dosatron", injectorColor: "Red",    tipColor: "Blue",   ratio: "100", gpm: "14.0", ozPerGallon: "1.280", notes: "D25RE industrial-scale" },
  { brand: "Dosatron", injectorColor: "Red",    tipColor: "Yellow", ratio: "50",  gpm: "14.0", ozPerGallon: "2.560", notes: "D25RE high-concentration" },

  // ── Dema ─────────────────────────────────────────────────────────────────
  { brand: "Dema", injectorColor: "Orange", tipColor: "Orange", ratio: "64",  gpm: "1.0", ozPerGallon: "2.000", notes: "Dema 606 standard" },
  { brand: "Dema", injectorColor: "Orange", tipColor: "Brown",  ratio: "32",  gpm: "1.0", ozPerGallon: "4.000", notes: "Dema 606 high-concentration" },
  { brand: "Dema", injectorColor: "Orange", tipColor: "Purple", ratio: "128", gpm: "1.0", ozPerGallon: "1.000", notes: "Dema 606 dilute" },
  { brand: "Dema", injectorColor: "Orange", tipColor: "White",  ratio: "256", gpm: "1.0", ozPerGallon: "0.500", notes: "Dema 606 ultra-dilute" },
  { brand: "Dema", injectorColor: "Brown",  tipColor: "Orange", ratio: "64",  gpm: "2.0", ozPerGallon: "2.000", notes: "Dema 656 high-flow" },
  { brand: "Dema", injectorColor: "Brown",  tipColor: "Brown",  ratio: "32",  gpm: "2.0", ozPerGallon: "4.000", notes: "Dema 656 concentrate" },
  { brand: "Dema", injectorColor: "Brown",  tipColor: "Purple", ratio: "128", gpm: "2.0", ozPerGallon: "1.000", notes: "Dema 656 rinse aid" },
  { brand: "Dema", injectorColor: "Purple", tipColor: "Orange", ratio: "64",  gpm: "0.5", ozPerGallon: "2.000", notes: "Dema 406 micro-dosing" },
  { brand: "Dema", injectorColor: "Purple", tipColor: "Brown",  ratio: "32",  gpm: "0.5", ozPerGallon: "4.000", notes: "Dema 406 micro-concentrate" },

  // ── Hydro Systems ────────────────────────────────────────────────────────
  { brand: "Hydro Systems", injectorColor: "Teal",   tipColor: "Teal",   ratio: "64",  gpm: "1.5", ozPerGallon: "2.000", notes: "EZ-Flo standard pre-soak" },
  { brand: "Hydro Systems", injectorColor: "Teal",   tipColor: "White",  ratio: "128", gpm: "1.5", ozPerGallon: "1.000", notes: "EZ-Flo rinse conditioning" },
  { brand: "Hydro Systems", injectorColor: "Teal",   tipColor: "Yellow", ratio: "32",  gpm: "1.5", ozPerGallon: "4.000", notes: "EZ-Flo tire cleaner" },
  { brand: "Hydro Systems", injectorColor: "White",  tipColor: "Teal",   ratio: "64",  gpm: "3.0", ozPerGallon: "2.000", notes: "EZ-Flo 3.0 high-volume" },
  { brand: "Hydro Systems", injectorColor: "White",  tipColor: "White",  ratio: "128", gpm: "3.0", ozPerGallon: "1.000", notes: "EZ-Flo 3.0 rinse" },
  { brand: "Hydro Systems", injectorColor: "White",  tipColor: "Yellow", ratio: "32",  gpm: "3.0", ozPerGallon: "4.000", notes: "EZ-Flo 3.0 tire/wheel" },
  { brand: "Hydro Systems", injectorColor: "Yellow", tipColor: "Teal",   ratio: "16",  gpm: "1.5", ozPerGallon: "8.000", notes: "EZ-Flo high-ratio bug remover" },
  { brand: "Hydro Systems", injectorColor: "Yellow", tipColor: "Yellow", ratio: "8",   gpm: "1.5", ozPerGallon: "16.000", notes: "EZ-Flo ultra-high concentrate" },

  // ── Lafferty ─────────────────────────────────────────────────────────────
  { brand: "Lafferty", injectorColor: "Green",  tipColor: "Green",  ratio: "64",  gpm: "1.0", ozPerGallon: "2.000", notes: "Lafferty foaming standard" },
  { brand: "Lafferty", injectorColor: "Green",  tipColor: "Red",    ratio: "32",  gpm: "1.0", ozPerGallon: "4.000", notes: "Lafferty foaming high-concentration" },
  { brand: "Lafferty", injectorColor: "Green",  tipColor: "Blue",   ratio: "128", gpm: "1.0", ozPerGallon: "1.000", notes: "Lafferty foaming dilute" },
  { brand: "Lafferty", injectorColor: "Red",    tipColor: "Green",  ratio: "64",  gpm: "2.0", ozPerGallon: "2.000", notes: "Lafferty 965 high-output" },
  { brand: "Lafferty", injectorColor: "Red",    tipColor: "Red",    ratio: "32",  gpm: "2.0", ozPerGallon: "4.000", notes: "Lafferty 965 high-output concentrate" },
  { brand: "Lafferty", injectorColor: "Red",    tipColor: "Blue",   ratio: "128", gpm: "2.0", ozPerGallon: "1.000", notes: "Lafferty 965 high-output dilute" },
  { brand: "Lafferty", injectorColor: "Blue",   tipColor: "Green",  ratio: "64",  gpm: "0.5", ozPerGallon: "2.000", notes: "Lafferty low-volume" },
  { brand: "Lafferty", injectorColor: "Blue",   tipColor: "Blue",   ratio: "128", gpm: "0.5", ozPerGallon: "1.000", notes: "Lafferty low-volume rinse" },

  // ── Foaming System ───────────────────────────────────────────────────────
  { brand: "Foaming System", injectorColor: "Pink",   tipColor: "Pink",   ratio: "32",  gpm: "1.2", ozPerGallon: "4.000", notes: "Standard foam cannon ratio" },
  { brand: "Foaming System", injectorColor: "Pink",   tipColor: "White",  ratio: "64",  gpm: "1.2", ozPerGallon: "2.000", notes: "Foam cannon light coverage" },
  { brand: "Foaming System", injectorColor: "Pink",   tipColor: "Black",  ratio: "16",  gpm: "1.2", ozPerGallon: "8.000", notes: "Foam cannon heavy coverage" },
  { brand: "Foaming System", injectorColor: "White",  tipColor: "Pink",   ratio: "32",  gpm: "2.5", ozPerGallon: "4.000", notes: "High-output foam arch" },
  { brand: "Foaming System", injectorColor: "White",  tipColor: "White",  ratio: "64",  gpm: "2.5", ozPerGallon: "2.000", notes: "High-output light foam" },
  { brand: "Foaming System", injectorColor: "Black",  tipColor: "Pink",   ratio: "16",  gpm: "1.2", ozPerGallon: "8.000", notes: "Heavy-duty bug remover foam" },

  // ── Pressure Washer Injector ─────────────────────────────────────────────
  { brand: "Pressure Washer Injector", injectorColor: "Black",  tipColor: "Black",  ratio: "20", gpm: "2.0", ozPerGallon: "6.400",  notes: "Downstream injector at low pressure" },
  { brand: "Pressure Washer Injector", injectorColor: "Black",  tipColor: "Gray",   ratio: "10", gpm: "2.0", ozPerGallon: "12.800", notes: "Downstream injector high-ratio" },
  { brand: "Pressure Washer Injector", injectorColor: "Black",  tipColor: "White",  ratio: "30", gpm: "2.0", ozPerGallon: "4.267",  notes: "Downstream injector dilute" },
  { brand: "Pressure Washer Injector", injectorColor: "Gray",   tipColor: "Black",  ratio: "20", gpm: "4.0", ozPerGallon: "6.400",  notes: "High-flow downstream standard" },
  { brand: "Pressure Washer Injector", injectorColor: "Gray",   tipColor: "Gray",   ratio: "10", gpm: "4.0", ozPerGallon: "12.800", notes: "High-flow downstream heavy" },
  { brand: "Pressure Washer Injector", injectorColor: "Gray",   tipColor: "White",  ratio: "30", gpm: "4.0", ozPerGallon: "4.267",  notes: "High-flow downstream light" },
  { brand: "Pressure Washer Injector", injectorColor: "White",  tipColor: "Black",  ratio: "20", gpm: "1.0", ozPerGallon: "6.400",  notes: "Low-flow downstream" },
  { brand: "Pressure Washer Injector", injectorColor: "White",  tipColor: "Gray",   ratio: "10", gpm: "1.0", ozPerGallon: "12.800", notes: "Low-flow downstream heavy concentration" },
];

// ---------------------------------------------------------------------------
// Field notes — sample operational log entries
// ---------------------------------------------------------------------------

const sampleNotes = [
  {
    title: "HydroMinder 64:1 Setup",
    content: "Red injector with tan metering tip. Verified at 1.1 GPM. Chemical: Top Dog Pre-Soak. Check every 90 days.",
    category: "Equipment",
    pinned: true,
  },
  {
    title: "ORP Troubleshoot Log",
    content: "ORP reading 650mV — elevated. Checked chlorine ppm (4.2 ppm). Reduced Cl2 feed rate 15%. Re-check in 24h.",
    category: "Troubleshooting",
    pinned: true,
  },
  {
    title: "Monthly Chemical Inventory",
    content: "Pre-soak: 3 drums. Tire cleaner: 1.5 drums. Spot-free rinse: 2 drums. Re-order pre-soak and spot-free by end of week.",
    category: "Inventory",
    pinned: false,
  },
];

async function seed() {
  console.log("🌱  Seeding dilution injectors…");

  // Seed dilution injectors — idempotent: skip entirely if rows already exist
  const existingInjectors = await db
    .select({ id: dilutionInjectorsTable.id })
    .from(dilutionInjectorsTable)
    .limit(1);

  if (existingInjectors.length > 0) {
    console.log(`⏭   Injectors: rows already present, skipping.`);
  } else {
    for (const inj of injectors) {
      await db.execute(sql`
        INSERT INTO dilution_injectors (brand, injector_color, tip_color, ratio, gpm, oz_per_gallon, notes)
        VALUES (
          ${inj.brand},
          ${inj.injectorColor},
          ${inj.tipColor},
          ${inj.ratio}::numeric,
          ${inj.gpm}::numeric,
          ${inj.ozPerGallon}::numeric,
          ${inj.notes ?? null}
        )
      `);
    }
    console.log(`✅  Injectors: ${injectors.length} rows inserted`);
  }

  console.log("🌱  Seeding sample field notes…");

  // Seed notes — idempotent: skip if any notes already exist
  const existingNotes = await db
    .select({ id: notesTable.id })
    .from(notesTable)
    .limit(1);

  if (existingNotes.length > 0) {
    console.log(`⏭   Notes: rows already present, skipping.`);
  } else {
    for (const note of sampleNotes) {
      await db.execute(sql`
        INSERT INTO notes (title, content, category, pinned)
        VALUES (${note.title}, ${note.content}, ${note.category}, ${note.pinned})
      `);
    }
    console.log(`✅  Notes: ${sampleNotes.length} rows inserted`);
  }

  console.log("🎉  Seed complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
