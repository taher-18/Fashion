import type { z } from "zod";
import type { ImportFile } from "@/lib/validation";
import { getDb } from "./client";

/** Everything needed to rebuild the closet: occasions, items and wear history (photos stay in Storage). */
export async function exportAll() {
  const db = getDb();
  const [occasions, items, worn] = await Promise.all([
    db.from("occasions").select("*").order("sort_order"),
    db.from("items").select("*").order("created_at"),
    db.from("outfits_worn").select("*").order("worn_on"),
  ]);
  const err = occasions.error ?? items.error ?? worn.error;
  if (err) throw new Error(err.message);
  return {
    app: "closet",
    version: 1,
    exported_at: new Date().toISOString(),
    occasions: occasions.data,
    items: items.data,
    outfits_worn: worn.data,
  };
}

export type ImportCounts = { occasions: number; itemsAdded: number; itemsUpdated: number; itemsSkipped: number; outfits: number };

/**
 * Merges a backup into the database. Nothing is deleted.
 * Items with an id are upserted; items without one (seed format) are added unless the name already exists.
 */
export async function importAll(data: z.output<typeof ImportFile>): Promise<ImportCounts> {
  const db = getDb();
  const counts: ImportCounts = { occasions: 0, itemsAdded: 0, itemsUpdated: 0, itemsSkipped: 0, outfits: 0 };

  if (data.occasions?.length) {
    const { error } = await db.from("occasions").upsert(data.occasions, { onConflict: "id" });
    if (error) throw new Error(`Occasions: ${error.message}`);
    counts.occasions = data.occasions.length;
  }

  if (data.items?.length) {
    const { data: existing, error } = await db.from("items").select("id, name");
    if (error) throw new Error(error.message);
    const ids = new Set(existing.map((r: { id: string }) => r.id));
    const names = new Set(existing.map((r: { name: string }) => r.name.toLowerCase()));

    const withId = data.items.filter((i) => i.id);
    const withoutId = data.items.filter((i) => !i.id && !names.has(i.name.toLowerCase()));
    counts.itemsSkipped = data.items.length - withId.length - withoutId.length;

    if (withId.length) {
      const { error: e } = await db.from("items").upsert(withId, { onConflict: "id" });
      if (e) throw new Error(`Items: ${e.message}`);
      counts.itemsUpdated = withId.filter((i) => ids.has(i.id as string)).length;
      counts.itemsAdded += withId.length - counts.itemsUpdated;
    }
    if (withoutId.length) {
      const { error: e } = await db.from("items").insert(withoutId);
      if (e) throw new Error(`Items: ${e.message}`);
      counts.itemsAdded += withoutId.length;
    }
  }

  if (data.outfits_worn?.length) {
    const { data: occ, error } = await db.from("occasions").select("id");
    if (error) throw new Error(error.message);
    const occIds = new Set(occ.map((o: { id: string }) => o.id));
    const rows = data.outfits_worn.map((o) => ({ ...o, occasion_id: o.occasion_id && occIds.has(o.occasion_id) ? o.occasion_id : null }));
    const withId = rows.filter((o) => o.id);
    const withoutId = rows.filter((o) => !o.id);
    if (withId.length) {
      const { error: e } = await db.from("outfits_worn").upsert(withId, { onConflict: "id" });
      if (e) throw new Error(`History: ${e.message}`);
    }
    if (withoutId.length) {
      const { error: e } = await db.from("outfits_worn").insert(withoutId);
      if (e) throw new Error(`History: ${e.message}`);
    }
    counts.outfits = rows.length;
  }

  return counts;
}
