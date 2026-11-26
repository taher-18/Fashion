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

/** Today's date in Cairo (YYYY-MM-DD). The DB default is UTC, which is a day behind after local midnight. */
export function cairoToday(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export async function createWorn(input: {
  item_ids: string[];
  occasion_id: string | null;
  weather: Weather | null;
}): Promise<OutfitWorn> {
  const { data, error } = await getDb()
    .from("outfits_worn")
    .insert({ ...input, worn_on: cairoToday() })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data as OutfitWorn;
}

export async function rateWorn(id: string, rating: -1 | 0 | 1): Promise<OutfitWorn | null> {
  const { data, error } = await getDb().from("outfits_worn").update({ rating }).eq("id", id).select("*").maybeSingle();
  if (error) throw new Error(error.message);
  return (data as OutfitWorn | null) ?? null;
}
