import type { Occasion } from "@/lib/types";
import { getDb } from "./client";

export async function listOccasions(): Promise<Occasion[]> {
  const { data, error } = await getDb().from("occasions").select("*").order("sort_order").order("label");
  if (error) throw new Error(error.message);
  return (data as Occasion[]).map((o) => ({ ...o, target_formality: Number(o.target_formality) }));
}

export type OccasionDraft = {
  id?: string;
  label: string;
  target_formality: number;
  strict: boolean;
  indoor: boolean;
  notes: string | null;
};

function slugify(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 32) || "occasion";
}

/** Creates a new occasion (id from the label) or updates an existing one. */
export async function saveOccasion(draft: OccasionDraft): Promise<void> {
  const db = getDb();
  const fields = {
    label: draft.label,
    target_formality: draft.target_formality,
    strict: draft.strict,
    indoor: draft.indoor,
    notes: draft.notes,
  };
  if (draft.id) {
    const { error } = await db.from("occasions").update(fields).eq("id", draft.id);
    if (error) throw new Error(error.message);
    return;
  }
  const existing = await listOccasions();
  const taken = new Set(existing.map((o) => o.id));
  const base = slugify(draft.label);
  let id = base;
  for (let n = 2; taken.has(id); n++) id = `${base}_${n}`;
  const sort_order = Math.max(-1, ...existing.map((o) => o.sort_order)) + 1;
  const { error } = await db.from("occasions").insert({ id, sort_order, ...fields });
  if (error) throw new Error(error.message);
}

/** Past outfits keep their items; their occasion just becomes blank (FK on delete set null). */
export async function deleteOccasion(id: string): Promise<void> {
  const { error } = await getDb().from("occasions").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
