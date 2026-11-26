import type { Occasion } from "@/lib/types";
import { getDb } from "./client";

export async function listOccasions(): Promise<Occasion[]> {
  const { data, error } = await getDb().from("occasions").select("*").order("sort_order").order("label");
  if (error) throw new Error(error.message);
  return (data as Occasion[]).map((o) => ({ ...o, target_formality: Number(o.target_formality) }));
}
