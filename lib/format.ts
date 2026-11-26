/** "zip_hoodie" -> "Zip hoodie" */
export function pretty(s: string): string {
  const t = s.replace(/_/g, " ").trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

/** "2026-11-26" -> "26 Nov 2026" */
export function formatDate(iso: string): string {
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export const FORMALITY_LABELS = ["Lounge", "Casual", "Smart casual", "Smart", "Formal"] as const;
export const WARMTH_LABELS = ["Very light", "Light", "Medium", "Warm", "Very warm"] as const;

export const SUBTYPE_SUGGESTIONS: Record<string, string[]> = {
  base: ["tee", "shirt", "polo", "tank"],
  mid: ["sweatshirt", "zip_hoodie", "hoodie", "sweater", "cardigan"],
  jacket: ["puffer", "bomber", "blazer", "denim_jacket", "coat", "overshirt"],
  pants: ["jeans", "trousers", "chinos", "joggers", "shorts"],
  shoes: ["sneakers", "boots", "dress_shoes", "loafers", "sandals"],
  accessory: ["belt", "watch", "cap", "bag", "sunglasses"],
};
