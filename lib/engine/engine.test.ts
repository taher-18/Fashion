// Run with: npm test   (Node's built-in runner; Node strips the TypeScript types itself)

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { SEED_OCCASIONS } from "../seed-occasions.ts";
import { WEATHERS } from "../types.ts";
import { clothing, scoreOutfit } from "./rules.ts";
import { historyReasons, slotDiff, suggestOutfits } from "./suggest.ts";
import type { EngineItem, EngineOccasion, Outfit } from "./types.ts";

// Taher's real closet from docs/seed/wardrobe.json, with stable fake ids.
const seed: EngineItem[] = (
  JSON.parse(readFileSync(new URL("../../docs/seed/wardrobe.json", import.meta.url), "utf8")) as { items: Omit<EngineItem, "id">[] }
).items.map((it, i) => ({ ...it, id: `item-${i}`, in_wash: false }));

const item = (name: string): EngineItem => {
  const found = seed.find((i) => i.name === name);
  if (!found) throw new Error(`No seed item named ${name}`);
  return found;
};
const occasion = (id: string): EngineOccasion => {
  const o = SEED_OCCASIONS.find((x) => x.id === id);
  if (!o) throw new Error(`No occasion ${id}`);
  return o;
};
const outfit = (parts: Partial<Outfit> & Pick<Outfit, "base" | "pants" | "shoes">): Outfit => ({
  mid: null,
  jacket: null,
  accessories: [],
  ...parts,
});
const reasonTexts = (r: { reasons: { text: string }[] }) => r.reasons.map((x) => x.text);

const whiteTee = item("White tee");
const blackTee = item("Black Tommy Hilfiger tee");
const navyTee = item("Navy Tommy Hilfiger New York tee");
const navyZip = item("Navy Tommy Hilfiger zip hoodie");
const navySweat = item("Navy Tommy Hilfiger sweatshirt");
const blackPuffer = item("Black Tommy Hilfiger puffer");
const slimJeans = item("Blue slim jeans");
const blackTrousers = item("Black trousers");
const whiteSneakers = item("White Tommy sneakers");
const joggers = item("Black joggers");

test("navy-on-black layering is penalised", () => {
  const date = occasion("date");
  // navy zip over a black tee
  const navyOverBlack = scoreOutfit(outfit({ base: blackTee, mid: navyZip, pants: slimJeans, shoes: whiteSneakers }), date, "mild");
  assert.ok(reasonTexts(navyOverBlack).includes("Navy and black blend into each other"));
  // black puffer over a navy sweatshirt
  const blackOverNavy = scoreOutfit(
    outfit({ base: whiteTee, mid: navySweat, jacket: blackPuffer, pants: slimJeans, shoes: whiteSneakers }),
    date,
    "cold",
  );
  assert.ok(reasonTexts(blackOverNavy).includes("Navy and black blend into each other"));
  // navy top with black pants is allowed: the ban is only for stacked top layers
  const navyTopBlackPants = scoreOutfit(outfit({ base: navyTee, pants: blackTrousers, shoes: whiteSneakers }), date, "warm");
  assert.ok(!reasonTexts(navyTopBlackPants).includes("Navy and black blend into each other"));
});

test("joggers never win Her family", () => {
  const family = occasion("family");
  for (const weather of WEATHERS) {
    const { outfits } = suggestOutfits({ items: seed, occasion: family, weather, limit: 6 });
    assert.ok(outfits.length > 0, `expected outfits for family/${weather}`);
    for (const o of outfits) {
      assert.notEqual(o.outfit.pants.subtype, "joggers", `joggers picked for family/${weather}`);
      assert.ok(!o.outfit.pants.flags.includes("ripped"), `ripped jeans picked for family/${weather}`);
    }
  }
  // Even if joggers are the only pants, they still don't get picked
  const onlyJoggers = seed.filter((i) => i.category !== "pants" || i.id === joggers.id);
  const res = suggestOutfits({ items: onlyJoggers, occasion: family, weather: "mild" });
  assert.equal(res.outfits.length, 0);
  assert.ok(res.emptyReason);
});

test("a white tee under a zip hoodie scores higher than a navy tee", () => {
  const friends = occasion("friends");
  const white = scoreOutfit(outfit({ base: whiteTee, mid: navyZip, pants: slimJeans, shoes: whiteSneakers }), friends, "mild");
  const navy = scoreOutfit(outfit({ base: navyTee, mid: navyZip, pants: slimJeans, shoes: whiteSneakers }), friends, "mild");
  assert.ok(white.score > navy.score, `white ${white.score} should beat navy ${navy.score}`);
  assert.ok(reasonTexts(white).includes("Light tee pops under the zip"));
  assert.ok(reasonTexts(navy).includes("Go lighter under the zip"));
});

test("the 3 results are diverse for every occasion and weather", () => {
  for (const occ of SEED_OCCASIONS) {
    for (const weather of WEATHERS) {
      const { outfits } = suggestOutfits({ items: seed, occasion: occ, weather });
      assert.equal(outfits.length, 3, `${occ.id}/${weather} gave ${outfits.length}`);
      for (let a = 0; a < outfits.length; a++)
        for (let b = a + 1; b < outfits.length; b++)
          assert.ok(slotDiff(outfits[a].outfit, outfits[b].outfit) >= 2, `${occ.id}/${weather} picks ${a} and ${b} too similar`);
    }
  }
});

test("layer rules follow the weather", () => {
  const friends = occasion("friends");
  for (const weather of WEATHERS) {
    for (const { outfit: o } of suggestOutfits({ items: seed, occasion: friends, weather, limit: 6 }).outfits) {
      if (weather === "hot" || weather === "warm") assert.ok(!o.mid && !o.jacket, `${weather}: base layer only`);
      if (weather === "mild") assert.ok((o.mid && !o.jacket) || (!o.mid && o.jacket && o.jacket.warmth <= 3), "mild: mid OR light jacket");
      if (weather === "cold") assert.ok(o.mid && o.jacket, "cold: base + mid + jacket");
    }
  }
});

test("reasons are capped at 3 positives and 2 warnings, sorted by weight", () => {
  for (const o of suggestOutfits({ items: seed, occasion: occasion("date"), weather: "mild", limit: 6 }).outfits) {
    assert.ok(o.positives.length <= 3 && o.warnings.length <= 2);
    for (let k = 1; k < o.positives.length; k++) assert.ok(o.positives[k - 1].points >= o.positives[k].points);
    for (let k = 1; k < o.warnings.length; k++) assert.ok(o.warnings[k - 1].points <= o.warnings[k].points);
  }
});

test("items in the wash are never picked", () => {
  const washed = seed.map((i) => (i.id === whiteSneakers.id || i.id === whiteTee.id ? { ...i, in_wash: true } : i));
  for (const o of suggestOutfits({ items: washed, occasion: occasion("date"), weather: "mild", limit: 6 }).outfits) {
    assert.ok(!o.itemIds.includes(whiteSneakers.id) && !o.itemIds.includes(whiteTee.id));
  }
});

test("Build around keeps the anchor in every pick, and refuses a jacket on a hot day", () => {
  const suede = item("Tan suede hooded bomber");
  const res = suggestOutfits({ items: seed, occasion: occasion("date"), weather: "mild", anchorId: suede.id });
  assert.equal(res.outfits.length, 3);
  for (const o of res.outfits) assert.equal(o.outfit.jacket?.id, suede.id);
  const hot = suggestOutfits({ items: seed, occasion: occasion("date"), weather: "hot", anchorId: suede.id });
  assert.equal(hot.outfits.length, 0);
  assert.match(hot.emptyReason ?? "", /doesn't fit hot weather/);
});

test("Build around keeps a mid layer in every pick on a mild day (regression)", () => {
  // Mild allows "mid layer OR light jacket"; the chosen mid must not be dropped for a jacket outfit.
  for (const [piece, occ] of [
    ["Navy Tommy Hilfiger sweatshirt", "date"],
    ["Black Tommy Jeans zip hoodie", "friends"],
  ] as const) {
    const anchor = item(piece);
    const res = suggestOutfits({ items: seed, occasion: occasion(occ), weather: "mild", anchorId: anchor.id });
    assert.equal(res.outfits.length, 3, `${piece}: expected 3 picks`);
    for (const o of res.outfits) assert.ok(o.itemIds.includes(anchor.id), `${piece} missing from a pick`);
  }
  // A low-scoring piece is still kept when you ask for it
  const joggersAnchor = suggestOutfits({ items: seed, occasion: occasion("friends"), weather: "warm", anchorId: joggers.id });
  for (const o of joggersAnchor.outfits) assert.equal(o.outfit.pants.id, joggers.id);
});

test("empty and thin closets explain what's missing in plain words", () => {
  assert.match(suggestOutfits({ items: [], occasion: occasion("date"), weather: "mild" }).emptyReason ?? "", /at least one top that's not in the wash/);
  const noShoes = seed.map((i) => (i.category === "shoes" ? { ...i, in_wash: true } : i));
  assert.match(suggestOutfits({ items: noShoes, occasion: occasion("date"), weather: "mild" }).emptyReason ?? "", /pair of shoes/);
  const noJackets = seed.filter((i) => i.category !== "jacket");
  assert.match(suggestOutfits({ items: noJackets, occasion: occasion("friends"), weather: "cold" }).emptyReason ?? "", /at least one jacket/);
});

test("history: recent repeats lose points, thumbs up wins points", () => {
  const date = occasion("date");
  const base = suggestOutfits({ items: seed, occasion: date, weather: "mild" }).outfits[0];
  const ids = clothing(base.outfit).map((i) => i.id);
  const recent = suggestOutfits({ items: seed, occasion: date, weather: "mild", history: [{ item_ids: ids, rating: null }] }).outfits[0];
  assert.notDeepEqual(clothing(recent.outfit).map((i) => i.id), ids, "yesterday's best pick should not top again");
  const liked = historyReasons(base.outfit, [{ item_ids: ["x", "y", "z"], rating: null }, { item_ids: ["x"], rating: null }, { item_ids: ["y"], rating: null }, { item_ids: ids, rating: 1 }]);
  assert.ok(liked.some((r) => r.text === "You liked this combo before"));
});

