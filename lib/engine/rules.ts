// Scores one outfit with the rules in docs/STYLE_RULES.md.
// Every rule adds or removes points and (usually) emits a short reason. Pure, no I/O.

import type { Color, Weather } from "../types";
import { COLOR_INFO } from "./colors.ts";
import type { EngineItem, EngineOccasion, Outfit, Reason } from "./types.ts";

const L = (c: Color) => COLOR_INFO[c].lightness;

const NAVYISH = new Set<Color>(["navy", "royal_blue"]);
const WHITEISH = new Set<Color>(["white", "off_white"]);
const LIGHT_UNDER = new Set<Color>(["white", "off_white", "cream", "light_grey", "grey"]);
const BROWN_SHOES = new Set<Color>(["brown", "dark_brown", "tan", "camel"]);
const SUEDE_COLORS = new Set<Color>(["tan", "camel", "brown", "dark_brown"]);
const BURGUNDY_OK_UNDER = new Set<Color>(["white", "off_white", "black", "light_grey", "grey", "charcoal"]);
const DARK_JEANS = new Set<Color>(["dark_blue_denim", "black", "charcoal"]);
const SMART_LIGHT_SHIRT = new Set<Color>(["cream", "beige", "off_white"]);
const TEE_UNDER_ZIP_BONUS: Partial<Record<Color, number>> = { white: 0.6, off_white: 0.5, light_grey: 0.4, cream: 0.2 };

export const isFleece = (i: EngineItem) => /fleece/i.test(i.name) || i.subtype === "fleece";
export const isPuffer = (i: EngineItem) => i.subtype === "puffer";
const isSuede = (i: EngineItem) => /suede/i.test(i.name) && SUEDE_COLORS.has(i.color);
const isBlueDenim = (i: EngineItem) => i.subtype === "jeans" && i.color.endsWith("_denim");
const isHooded = (i: EngineItem) => i.flags.includes("hooded");

/** Date night and strict occasions (Her family) get the "too relaxed" penalties. */
export const isDressy = (o: EngineOccasion) => o.id === "date" || o.id === "family" || o.strict;
/** Strict occasions ban joggers, ripped jeans and fleece outright. */
export const isFamilyLike = (o: EngineOccasion) => o.id === "family" || o.strict;

/** Top layers from inside out. */
export const topLayers = (o: Outfit): EngineItem[] =>
  [o.base, o.mid, o.jacket].filter((x): x is EngineItem => x !== null);

/** Everything except accessories. */
export const clothing = (o: Outfit): EngineItem[] => [...topLayers(o), o.pants, o.shoes];

export function scoreOutfit(o: Outfit, occ: EngineOccasion, weather: Weather): { score: number; reasons: Reason[] } {
  const reasons: Reason[] = [];
  let score = 0;
  /** text = null means the points count but nothing is shown. */
  const add = (points: number, text: string | null = null) => {
    score += points;
    if (text) reasons.push({ text, points });
  };

  const layers = topLayers(o);
  const top = o.mid ?? o.base; // main visible top (jacket may be open)
  const outer = o.jacket ?? top;
  const adjacent: [EngineItem, EngineItem][] = layers.slice(1).map((l, k) => [layers[k], l]);

  // --- Contrast and color ---
  if (top.color === o.pants.color) add(-3, "Top and pants look flat together");
  else {
    const d = Math.abs(L(top.color) - L(o.pants.color));
    if (d >= 40) add(2, "Top stands out against the pants");
    else if (d < 12) add(-1, "Top and pants are too close in shade");
  }

  if (adjacent.some(([a, b]) => (NAVYISH.has(a.color) && b.color === "black") || (a.color === "black" && NAVYISH.has(b.color)))) {
    add(-2, "Navy and black blend into each other");
  }

  if (adjacent.some(([a, b]) => (a.color === "cream" && WHITEISH.has(b.color)) || (WHITEISH.has(a.color) && b.color === "cream"))) {
    add(-1, "Cream next to white looks faded");
  }

  if (outer.color === "black" && o.pants.color === "black" && o.shoes.color === "black") {
    add(-1, "All black looks heavy, add a light piece");
  }

  if (BROWN_SHOES.has(o.shoes.color) && layers.some((l) => l.color === "navy")) {
    add(-1, "Brown shoes clash with navy here");
  }

  // --- Layering ---
  if (o.mid?.subtype === "zip_hoodie") {
    if (o.base.subtype !== "tee") add(-2, "Wear a tee under the zip");
    else if (L(o.base.color) - L(o.mid.color) >= 40) add(1.5, "Light tee pops under the zip");
    else add(-1, "Go lighter under the zip");
    add(TEE_UNDER_ZIP_BONUS[o.base.color] ?? 0); // white > light grey > cream
    if (o.mid.color === "royal_blue" && (o.base.color === "navy" || o.base.color === "black")) {
      add(-2, "Navy or black under royal blue disappears");
    }
  }

  if (o.jacket && o.mid && isHooded(o.jacket) && isHooded(o.mid)) add(-1.5, "Two hoods get bulky");

  if (o.jacket && isPuffer(o.jacket) && o.jacket.color === "burgundy") {
    const under = [o.base, o.mid].filter((x): x is EngineItem => x !== null);
    const clean = under.every((u) => BURGUNDY_OK_UNDER.has(u.color)) && o.pants.subtype === "jeans" && DARK_JEANS.has(o.pants.color);
    if (clean) add(1, "Burgundy puffer pops over clean neutrals");
    else add(-1.5, "Too much color with the burgundy puffer");
  }

  if (o.jacket && isPuffer(o.jacket) && o.jacket.color === "black" && top.color === "black") {
    add(-1, "Black puffer over black gets heavy");
  }

  // --- Pairings that work ---
  if (o.jacket && isSuede(o.jacket)) {
    if (isBlueDenim(o.pants)) add(2, "Tan suede and blue denim are a classic match");
    if (LIGHT_UNDER.has(top.color)) add(1, "Light layer under the suede looks clean");
    if (o.shoes.color === "olive") add(1, "Olive Timberlands suit the suede");
  }

  if (layers.some((l) => l.color === "royal_blue") && isBlueDenim(o.pants) && L(o.pants.color) > L("royal_blue")) {
    add(0.5, "Royal blue with lighter denim works");
  }

  if (o.shoes.color === "white" && o.shoes.subtype === "sneakers") add(1, "White sneakers keep it fresh");

  if (
    o.base.subtype === "shirt" &&
    SMART_LIGHT_SHIRT.has(o.base.color) &&
    o.pants.subtype === "trousers" &&
    o.pants.color === "black" &&
    o.shoes.color === "black"
  ) {
    add(1.5, "Polished and clean");
  }

  // --- Occasion fit ---
  const pieces = clothing(o);
  const avg = pieces.reduce((s, p) => s + p.formality, 0) / pieces.length;
  const gap = Math.abs(avg - occ.target_formality);
  if (gap <= 0.35) {
    add(-2 * gap);
    add(0.5, "Right level of dressy");
  } else if (gap >= 0.75) {
    add(-2 * gap, avg < occ.target_formality ? `Too casual for ${shortLabel(occ.label)}` : `A bit dressy for ${shortLabel(occ.label)}`);
  } else {
    add(-2 * gap);
  }

  const dressy = isDressy(occ);
  const familyLike = isFamilyLike(occ);

  if (dressy && o.pants.subtype === "joggers") add(-3, "Joggers are too relaxed here");

  if (o.pants.flags.includes("ripped")) {
    if (familyLike) add(-2, "Ripped jeans won't fly here");
    else if (occ.id === "date") add(-0.8, "Ripped jeans are a bit much for a date");
  }

  if (familyLike && pieces.some(isFleece)) add(-1.5, "Fleece is too loungey here");

  if (dressy && layers.some((l) => l.flags.includes("graphic"))) add(-1.5, "Graphic tee is too casual here");

  if (o.jacket && isPuffer(o.jacket)) {
    if (occ.indoor && weather !== "cold") add(-1, "Puffer is bulky in a cinema seat");
    if (dressy) add(-0.5, "A cleaner jacket beats a puffer here");
  }

  if (
    familyLike &&
    (o.pants.subtype === "trousers" || o.pants.color === "dark_blue_denim") &&
    L(top.color) >= 75 &&
    !(o.jacket && isPuffer(o.jacket))
  ) {
    add(0.75, "Mature smart-casual look");
  }

  if (occ.id === "semi_formal") {
    if (o.base.subtype !== "shirt") add(-3, "Semi-formal needs a shirt");
    if (o.jacket?.subtype === "blazer") add(1, "Blazer makes it proper");
  }

  // --- Taste notes ---
  if (o.pants.subtype === "jeans" && o.pants.fit === "slim") add(0.5, "Slim jeans look sharper on you");

  // Tuning (not in STYLE_RULES): formal shoes were winning on formality points alone.
  if (o.shoes.subtype === "dress_shoes" && (o.pants.subtype === "jeans" || o.pants.subtype === "joggers")) {
    add(-1.5, `Dress shoes look stiff with ${o.pants.subtype}`);
  }

  return { score, reasons };
}

/** "Semi-formal (Katb Ketab, events)" -> "Semi-formal" */
export function shortLabel(label: string): string {
  return label.replace(/\s*\(.*\)\s*$/, "");
}
