// Server-side glue: loads history, runs the pure engine, and adds photo URLs for the UI.

import { listWorn } from "@/lib/db/outfits";
import { signPhotoUrls } from "@/lib/db/storage";
import { suggestOutfits } from "@/lib/engine/suggest";
import type { Reason } from "@/lib/engine/types";
import type { Category, Color, Item, Occasion, Weather } from "@/lib/types";

export type PieceView = { id: string; name: string; category: Category; subtype: string; color: Color; photoUrl: string | null };
export type SuggestionView = { itemIds: string[]; score: number; positives: Reason[]; warnings: Reason[]; pieces: PieceView[] };
export type SuggestionsResult = { outfits: SuggestionView[]; emptyReason: string | null };

export async function getSuggestions(opts: {
  items: Item[];
  occasion: Occasion;
  weather: Weather;
  anchorId?: string | null;
  limit?: number;
}): Promise<SuggestionsResult> {
  const history = await listWorn(30);
  const result = suggestOutfits({
    items: opts.items,
    occasion: opts.occasion,
    weather: opts.weather,
    anchorId: opts.anchorId ?? null,
    history: history.map((h) => ({ item_ids: h.item_ids, rating: h.rating })),
    limit: opts.limit ?? 6, // extra picks back up the "Not this" button
  });

  const byId = new Map(opts.items.map((i) => [i.id, i]));
  const used = result.outfits.flatMap((o) => o.itemIds).map((id) => byId.get(id)?.photo_path ?? null);
  const urls = await signPhotoUrls(used);

  return {
    emptyReason: result.emptyReason,
    outfits: result.outfits.map((o) => ({
      itemIds: o.itemIds,
      score: o.score,
      positives: o.positives,
      warnings: o.warnings,
      pieces: o.itemIds.flatMap((id) => {
        const it = byId.get(id);
        if (!it) return [];
        return [{ id, name: it.name, category: it.category, subtype: it.subtype, color: it.color, photoUrl: it.photo_path ? urls[it.photo_path] ?? null : null }];
      }),
    })),
  };
}

/** Rough Cairo default so the weather chip starts on something sensible. */
export function defaultWeather(now = new Date()): Weather {
  const month = Number(new Intl.DateTimeFormat("en-US", { month: "numeric", timeZone: "Africa/Cairo" }).format(now));
  if (month >= 6 && month <= 9) return "hot";
  if (month === 4 || month === 5 || month === 10) return "warm";
  if (month === 3 || month === 11) return "mild";
  return "cold";
}
