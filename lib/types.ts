// Shared constants and types. No imports here so plain Node scripts
// (scripts/seed.mts) can import this file directly.

export const CATEGORIES = ["base", "mid", "jacket", "pants", "shoes", "accessory"] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABELS: Record<Category, string> = {
  base: "Tops",
  mid: "Mid layers",
  jacket: "Jackets",
  pants: "Pants",
  shoes: "Shoes",
  accessory: "Accessories",
};

export const COLORS = [
  "white",
  "off_white",
  "cream",
  "beige",
  "light_grey",
  "grey",
  "charcoal",
  "black",
  "navy",
  "royal_blue",
  "bright_blue",
  "light_blue_denim",
  "mid_blue_denim",
  "dark_blue_denim",
  "tan",
  "camel",
  "brown",
  "dark_brown",
  "burgundy",
  "olive",
  "red",
  "other",
] as const;
export type Color = (typeof COLORS)[number];

export const FITS = ["slim", "regular", "baggy", "oversized"] as const;
export type Fit = (typeof FITS)[number];

export const FLAGS = ["ripped", "graphic", "hooded", "bulky", "logo_big"] as const;
export type Flag = (typeof FLAGS)[number];

export const WEATHERS = ["hot", "warm", "mild", "cold"] as const;
export type Weather = (typeof WEATHERS)[number];

export type Item = {
  id: string;
  name: string;
  brand: string | null;
  category: Category;
  subtype: string;
  color: Color;
  formality: number;
  warmth: number;
  fit: Fit | null;
  flags: string[];
  photo_path: string | null;
  in_wash: boolean;
  notes: string | null;
  needs_confirm: boolean;
  created_at: string;
};

export type Occasion = {
  id: string;
  label: string;
  target_formality: number;
  strict: boolean;
  indoor: boolean;
  notes: string | null;
  sort_order: number;
};

export type OutfitWorn = {
  id: string;
  item_ids: string[];
  occasion_id: string | null;
  weather: Weather | null;
  rating: -1 | 0 | 1 | null;
  worn_on: string;
  created_at: string;
};
