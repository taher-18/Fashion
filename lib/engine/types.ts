// Engine types. Pure: no imports with runtime effects, so `node --test` can load it directly.

import type { Category, Color, Fit, Weather } from "../types";

export type EngineItem = {
  id: string;
  name: string;
  category: Category;
  subtype: string;
  color: Color;
  formality: number;
  warmth: number;
  fit: Fit | null;
  flags: string[];
  in_wash?: boolean;
};

export type EngineOccasion = {
  id: string;
  label: string;
  target_formality: number;
  strict: boolean;
  indoor: boolean;
};

/** A past outfit, newest first in the history array. */
export type HistoryEntry = { item_ids: string[]; rating: number | null };

export type Outfit = {
  base: EngineItem;
  mid: EngineItem | null;
  jacket: EngineItem | null;
  pants: EngineItem;
  shoes: EngineItem;
  accessories: EngineItem[];
};

export type Reason = { text: string; points: number };

export type ScoredOutfit = {
  outfit: Outfit;
  itemIds: string[];
  score: number;
  /** Up to 3, strongest first. */
  positives: Reason[];
  /** Up to 2, worst first. */
  warnings: Reason[];
};

export type SuggestInput = {
  items: EngineItem[];
  occasion: EngineOccasion;
  weather: Weather;
  anchorId?: string | null;
  history?: HistoryEntry[];
  /** How many diverse outfits to return (default 3). */
  limit?: number;
};

export type SuggestResult = { outfits: ScoredOutfit[]; emptyReason: string | null };
