// Builds every valid outfit for the weather, scores it, applies history,
// and returns the top N that differ from each other by at least 2 pieces. Pure, no I/O.

import type { Category, Weather } from "../types.ts";
import { clothing, isFleece, scoreOutfit, shortLabel } from "./rules.ts";
import type { EngineItem, EngineOccasion, HistoryEntry, Outfit, Reason, ScoredOutfit, SuggestInput, SuggestResult } from "./types.ts";

const SLOTS = ["base", "mid", "jacket", "pants", "shoes"] as const;

type Plan = { mid: boolean; jacket: "none" | "light" | "any" };

/** Layer rules from docs/SPEC.md. */
const PLANS: Record<Weather, Plan[]> = {
  hot: [{ mid: false, jacket: "none" }],
  warm: [{ mid: false, jacket: "none" }],
  mild: [
    { mid: true, jacket: "none" },
    { mid: false, jacket: "light" },
  ],
  cold: [{ mid: true, jacket: "any" }],
};

const isLightJacket = (j: EngineItem) => j.warmth <= 3;

/** How to name a missing piece in the "No outfits" message. */
const NEED: Record<Category, string> = {
  base: "top",
  mid: "mid layer",
  jacket: "jacket",
  pants: "pair of pants",
  shoes: "pair of shoes",
  accessory: "accessory",
};

/** Hard bans for strict occasions (Her family): these pieces can never appear. */
export function isBanned(item: EngineItem, occ: EngineOccasion): boolean {
  if (!occ.strict) return false;
  return item.subtype === "joggers" || item.flags.includes("ripped") || isFleece(item);
}

/** Number of clothing slots (base, mid, jacket, pants, shoes) where two outfits differ. */
export function slotDiff(a: Outfit, b: Outfit): number {
  return SLOTS.filter((s) => (a[s]?.id ?? null) !== (b[s]?.id ?? null)).length;
}

export function pickDiverse(sorted: ScoredOutfit[], n: number, minDiff = 2): ScoredOutfit[] {
  const out: ScoredOutfit[] = [];
  for (const c of sorted) {
    if (out.every((p) => slotDiff(p.outfit, c.outfit) >= minDiff)) out.push(c);
    if (out.length === n) break;
  }
  return out;
}

/** History rules: recent repeats and thumbs up/down on similar combos. */
export function historyReasons(o: Outfit, history: HistoryEntry[]): Reason[] {
  const reasons: Reason[] = [];
  const recent = new Set(history.slice(0, 3).flatMap((h) => h.item_ids));
  const mainTop = o.mid ?? o.base;
  for (const piece of [mainTop, o.jacket]) {
    if (piece && recent.has(piece.id)) reasons.push({ text: `You wore the ${piece.name} recently`, points: -1.2 });
  }
  const ids = clothing(o).map((i) => i.id);
  let liked = false;
  let disliked = false;
  for (const h of history) {
    if (h.rating !== 1 && h.rating !== -1) continue;
    const overlap = ids.filter((id) => h.item_ids.includes(id)).length;
    if (overlap < 3) continue;
    if (h.rating === 1) liked = true;
    else disliked = true;
  }
  if (liked) reasons.push({ text: "You liked this combo before", points: 1 });
  if (disliked) reasons.push({ text: "You gave this combo a thumbs down", points: -2 });
  return reasons;
}

function finalize(outfit: Outfit, score: number, reasons: Reason[]): ScoredOutfit {
  const merged = new Map<string, number>();
  for (const r of reasons) merged.set(r.text, (merged.get(r.text) ?? 0) + r.points);
  const all = [...merged].map(([text, points]) => ({ text, points }));
  return {
    outfit,
    itemIds: [...clothing(outfit), ...outfit.accessories].map((i) => i.id),
    score: Math.round(score * 100) / 100,
    positives: all.filter((r) => r.points > 0).sort((a, b) => b.points - a.points).slice(0, 3),
    warnings: all.filter((r) => r.points < 0).sort((a, b) => a.points - b.points).slice(0, 2),
  };
}

const empty = (emptyReason: string): SuggestResult => ({ outfits: [], emptyReason });

export function suggestOutfits(input: SuggestInput): SuggestResult {
  const { occasion: occ, weather } = input;
  const limit = input.limit ?? 3;
  const history = input.history ?? [];
  const pool = input.items.filter((i) => !i.in_wash);
  const usable = pool.filter((i) => !isBanned(i, occ));

  const anchor = input.anchorId ? pool.find((i) => i.id === input.anchorId) ?? null : null;
  if (input.anchorId && !anchor) return empty("That piece is in the wash or no longer in your closet.");
  if (anchor && isBanned(anchor, occ)) return empty(`The ${anchor.name} doesn't work for ${shortLabel(occ.label)}.`);

  const by = (cat: Category) =>
    anchor && anchor.category === cat ? [anchor] : usable.filter((i) => i.category === cat);
  const bases = by("base");
  const mids = by("mid");
  const jackets = by("jacket");
  const pants = by("pants");
  const shoes = by("shoes");

  const plans = PLANS[weather];
  if (anchor && anchor.category !== "accessory") {
    const fits = plans.some(
      (p) =>
        ["base", "pants", "shoes"].includes(anchor.category) ||
        (anchor.category === "mid" && p.mid) ||
        (anchor.category === "jacket" && (p.jacket === "any" || (p.jacket === "light" && isLightJacket(anchor)))),
    );
    if (!fits) return empty(`The ${anchor.name} doesn't fit ${weather} weather.`);
  }

  // Build every candidate
  const candidates: Outfit[] = [];
  for (const plan of plans) {
    const midOpts: (EngineItem | null)[] = plan.mid ? mids : [null];
    const jacketOpts: (EngineItem | null)[] =
      plan.jacket === "none" ? [null] : plan.jacket === "light" ? jackets.filter(isLightJacket) : jackets;
    for (const b of bases)
      for (const m of midOpts)
        for (const j of jacketOpts)
          for (const p of pants)
            for (const s of shoes) candidates.push({ base: b, mid: m, jacket: j, pants: p, shoes: s, accessories: [] });
  }

  if (candidates.length === 0) {
    const needed: Category[] = ["base", "pants", "shoes"];
    if (plans.every((p) => p.mid)) needed.push("mid");
    if (plans.every((p) => p.jacket === "any")) needed.push("jacket");
    const missing = needed.find((c) => by(c).length === 0);
    if (missing) return empty(`No outfits: you need at least one ${NEED[missing]} that's not in the wash.`);
    return empty(`No outfits for ${weather} weather: you need a mid layer or a light jacket that's not in the wash.`);
  }

  // Build around: every outfit must contain the chosen piece. Mild weather has two layer plans
  // (mid layer OR light jacket) and the piece only belongs to one, so filter explicitly.
  const mustHave = anchor && anchor.category !== "accessory" ? anchor.id : null;
  const kept = mustHave ? candidates.filter((c) => clothing(c).some((i) => i.id === mustHave)) : candidates;

  // Score, apply history, rank
  const scored = kept.map((o) => {
    const { score, reasons } = scoreOutfit(o, occ, weather);
    const hist = historyReasons(o, history);
    const total = score + hist.reduce((s, r) => s + r.points, 0);
    return { o, total, reasons: [...reasons, ...hist] };
  });
  scored.sort((a, b) => b.total - a.total || idKey(a.o).localeCompare(idKey(b.o)));

  const ranked = scored.map((s) => finalize(s.o, s.total, s.reasons));
  const picks = pickDiverse(ranked, limit);

  // Accessories: the anchor if it is one, and belt + watch for semi-formal
  const accessories = usable.filter((i) => i.category === "accessory");
  const outfits = picks.map((pick) => {
    const extra: EngineItem[] = [];
    if (anchor?.category === "accessory") extra.push(anchor);
    if (occ.id === "semi_formal") {
      const watch = accessories
        .filter((a) => a.subtype === "watch")
        .sort((a, b) => b.formality - a.formality)[0];
      if (watch && !extra.includes(watch)) extra.push(watch);
      const belt = accessories.find((a) => a.subtype === "belt" && a.color === pick.outfit.pants.color);
      if (belt && pick.outfit.pants.subtype === "trousers" && !extra.includes(belt)) extra.push(belt);
    }
    if (extra.length === 0) return pick;
    const outfit = { ...pick.outfit, accessories: extra };
    const tip: Reason[] = occ.id === "semi_formal" ? [{ text: "Tuck the shirt in, add the belt and a watch", points: 0.5 }] : [];
    return finalize(outfit, pick.score + tip.reduce((s, r) => s + r.points, 0), [...pick.positives, ...pick.warnings, ...tip]);
  });

  return { outfits, emptyReason: null };
}

const idKey = (o: Outfit) => clothing(o).map((i) => i.id).join("|");
