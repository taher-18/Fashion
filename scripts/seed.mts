// Loads the occasions table and docs/seed/wardrobe.json into Supabase.
// Run with: npm run seed   (reads .env.local; needs supabase/schema.sql applied first)
// Safe to re-run: occasions are upserted, items are only added if no item with that name exists.

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { CATEGORIES, COLORS, FITS, FLAGS } from "../lib/types.ts";
import { SEED_OCCASIONS as OCCASIONS } from "../lib/seed-occasions.ts";

const SeedItem = z.object({
  name: z.string().min(1),
  brand: z.string().nullable(),
  category: z.enum(CATEGORIES),
  subtype: z.string().min(1),
  color: z.enum(COLORS),
  formality: z.number().int().min(1).max(5),
  warmth: z.number().int().min(1).max(5),
  fit: z.enum(FITS).nullable(),
  flags: z.array(z.enum(FLAGS)),
  notes: z.string().nullable(),
  needs_confirm: z.boolean(),
});
const SeedFile = z.object({ items: z.array(SeedItem) });

function fail(msg: string): never {
  console.error(`\n✗ ${msg}\n`);
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) fail("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local");

const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const raw: unknown = JSON.parse(readFileSync(new URL("../docs/seed/wardrobe.json", import.meta.url), "utf8"));
const parsed = SeedFile.safeParse(raw);
if (!parsed.success) fail(`docs/seed/wardrobe.json is invalid:\n${z.prettifyError(parsed.error)}`);
const seedItems = parsed.data.items;

// 1. Occasions
const occ = await db.from("occasions").upsert(OCCASIONS, { onConflict: "id" });
if (occ.error) {
  if (occ.error.code === "42P01" || occ.error.code === "PGRST205") {
    fail("Tables not found. Run supabase/schema.sql in the Supabase SQL Editor first.");
  }
  fail(`Occasions: ${occ.error.message}`);
}
console.log(`✓ Occasions: ${OCCASIONS.length} upserted`);

// 2. Items (skip names that already exist so re-running never duplicates)
const existing = await db.from("items").select("name");
if (existing.error) fail(`Items: ${existing.error.message}`);
const have = new Set(existing.data.map((r: { name: string }) => r.name.toLowerCase()));
const toInsert = seedItems.filter((i) => !have.has(i.name.toLowerCase()));

if (toInsert.length > 0) {
  const ins = await db.from("items").insert(toInsert);
  if (ins.error) fail(`Items: ${ins.error.message}`);
}
console.log(`✓ Items: ${toInsert.length} added, ${seedItems.length - toInsert.length} already there`);

// 3. Summary straight from the DB
const { count, error } = await db.from("items").select("*", { count: "exact", head: true });
if (error) fail(error.message);
const { data: perCat, error: catErr } = await db.from("items").select("category");
if (catErr) fail(catErr.message);
const tally: Record<string, number> = {};
for (const r of perCat) tally[r.category] = (tally[r.category] ?? 0) + 1;
console.log(`✓ Closet now has ${count} items:`, tally);
