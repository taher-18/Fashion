import type { RateResult } from "@/lib/ai/schemas";
import { getDb } from "./client";

export async function saveFitCheck(input: { photo_path: string; occasion_id: string; ai_result: RateResult }): Promise<string> {
  const { data, error } = await getDb().from("fit_checks").insert(input).select("id").single();
  if (error) throw new Error(error.message);
  return (data as { id: string }).id;
}
