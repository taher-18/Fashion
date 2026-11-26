import { z } from "zod";
import { CATEGORIES, COLORS, FITS, FLAGS, WEATHERS } from "./types";

export const PHOTO_PATH_RE = /^items\/[0-9a-f-]{36}\.jpg$/;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .transform((v) => (v ? v : null));

export const ItemInput = z.object({
  name: z.string().trim().min(1, "Give it a name").max(80),
  brand: optionalText(60),
  category: z.enum(CATEGORIES),
  subtype: z
    .string()
    .trim()
    .min(1, "Pick a type")
    .max(40)
    .transform((s) => s.toLowerCase().replace(/[\s-]+/g, "_")),
  color: z.enum(COLORS),
  formality: z.number().int().min(1).max(5),
  warmth: z.number().int().min(1).max(5),
  fit: z.enum(FITS).nullable(),
  flags: z
    .array(z.enum(FLAGS))
    .max(FLAGS.length)
    .transform((a) => [...new Set(a)]),
  notes: optionalText(500),
  photo_path: z.string().regex(PHOTO_PATH_RE).nullable(),
  in_wash: z.boolean(),
  needs_confirm: z.boolean(),
});

export const ItemCreate = ItemInput.extend({
  photo_path: z.string().regex(PHOTO_PATH_RE).nullable().default(null),
  in_wash: z.boolean().default(false),
  needs_confirm: z.boolean().default(false),
});

export const ItemPatch = ItemInput.partial().strict();

export const Uuid = z.uuid();

/** First readable problem from a zod error, for showing in the UI. */
export function firstIssue(err: z.ZodError): string {
  const i = err.issues[0];
  if (!i) return "Invalid input";
  const field = i.path.join(".");
  return field ? `${field}: ${i.message}` : i.message;
}

export const SuggestBody = z.object({
  occasion_id: z.string().min(1).max(40),
  weather: z.enum(WEATHERS),
  anchor_id: z.uuid().nullable().optional(),
  limit: z.number().int().min(1).max(10).optional(),
});

export const WearBody = z.object({
  item_ids: z.array(z.uuid()).min(1).max(12),
  occasion_id: z.string().min(1).max(40).nullable(),
  weather: z.enum(WEATHERS).nullable(),
});

export const RateBody = z.object({ rating: z.union([z.literal(-1), z.literal(0), z.literal(1)]) });
