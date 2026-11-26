import type { z } from "zod";
import type { Item } from "@/lib/types";
import type { ItemCreate, ItemPatch } from "@/lib/validation";
import { getDb } from "./client";
import { removePhotos } from "./storage";

export type WearStats = { timesWorn: number; lastWorn: string | null };

export async function listItems(): Promise<Item[]> {
  const { data, error } = await getDb().from("items").select("*").order("name");
  if (error) throw new Error(error.message);
  return data as Item[];
}

export async function getItem(id: string): Promise<Item | null> {
  const { data, error } = await getDb().from("items").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as Item | null) ?? null;
}

export async function getWearStats(id: string): Promise<WearStats> {
  const { data, count, error } = await getDb()
    .from("outfits_worn")
    .select("worn_on", { count: "exact" })
    .contains("item_ids", [id])
    .order("worn_on", { ascending: false })
    .limit(1);
  if (error) throw new Error(error.message);
  return { timesWorn: count ?? 0, lastWorn: (data?.[0]?.worn_on as string | undefined) ?? null };
}

export async function createItem(input: z.output<typeof ItemCreate>): Promise<Item> {
  const { data, error } = await getDb().from("items").insert(input).select("*").single();
  if (error) throw new Error(error.message);
  return data as Item;
}

/** Updates an item. Removes the old photo from Storage if it was replaced. */
export async function updateItem(id: string, patch: z.output<typeof ItemPatch>): Promise<Item | null> {
  const before = await getItem(id);
  if (!before) return null;
  const { data, error } = await getDb().from("items").update(patch).eq("id", id).select("*").single();
  if (error) throw new Error(error.message);
  if ("photo_path" in patch && before.photo_path && before.photo_path !== patch.photo_path) {
    await removePhotos([before.photo_path]);
  }
  return data as Item;
}

/** Deletes an item and its photo. Returns false if it didn't exist. */
export async function deleteItem(id: string): Promise<boolean> {
  const before = await getItem(id);
  if (!before) return false;
  const { error } = await getDb().from("items").delete().eq("id", id);
  if (error) throw new Error(error.message);
  if (before.photo_path) await removePhotos([before.photo_path]);
  return true;
}
