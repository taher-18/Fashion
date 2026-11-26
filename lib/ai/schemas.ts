// Zod schemas for the AI's JSON output. Sent to Claude as output_config.format and
// used again to validate the reply (CLAUDE.md: every AI response is parsed with zod).

import { z } from "zod";
import { CATEGORIES, COLORS, FITS, FLAGS } from "@/lib/types";

export const TagResult = z.object({
  is_clothing: z.boolean(),
  name: z.string(),
  category: z.enum(CATEGORIES),
  subtype: z.string(),
  color: z.enum(COLORS),
  brand: z.string().nullable(),
  formality: z.number(),
  warmth: z.number(),
  fit: z.enum(FITS).nullable(),
  flags: z.array(z.enum(FLAGS)),
  note: z.string().nullable(),
});
export type TagResult = z.infer<typeof TagResult>;

/** Swap ids are restricted to the closet refs sent with the request, so made-up ids can't come back. */
export function rateResultSchema(refs: [string, ...string[]]) {
  return z.object({
    can_rate: z.boolean(),
    score: z.number(),
    verdict: z.string(),
    works: z.array(z.string()),
    change: z.array(z.string()),
    swaps: z.array(z.object({ item_id: z.enum(refs), reason: z.string() })),
  });
}

/** What the app stores in fit_checks.ai_result and returns to the browser. */
export type RateResult = {
  can_rate: boolean;
  score: number;
  verdict: string;
  works: string[];
  change: string[];
  swaps: { item_id: string; reason: string }[];
};
