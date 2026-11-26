import type { OutfitWorn, Weather } from "@/lib/types";
import { getDb } from "./client";

/** Newest first. */
export async function listWorn(limit = 60): Promise<OutfitWorn[]> {
  const { data, error } = await getDb()
    .from("outfits_worn")
    .select("*")
    .order("worn_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data as OutfitWorn[];
}

export async function createWorn(input: {
  item_ids: string[];
  occasion_id: string | null;
  weather: Weather | null;
}): Promise<OutfitWorn> {
  const { data, error } = await getDb().from("outfits_worn").insert(input).select("*").single();
  if (error) throw new Error(error.message);
  return data as OutfitWorn;
}

export async function rateWorn(id: string, rating: -1 | 0 | 1): Promise<OutfitWorn | null> {
  const { data, error } = await getDb().from("outfits_worn").update({ rating }).eq("id", id).select("*").maybeSingle();
  if (error) throw new Error(error.message);
  return (data as OutfitWorn | null) ?? null;
}
