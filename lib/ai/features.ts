// The two AI features from docs/SPEC.md: tagItem and rateFit.

import { readFileSync } from "node:fs";
import path from "node:path";
import type { Item, Occasion } from "@/lib/types";
import { AiError, askJson, jpegBlock } from "./client";
import { TAG_SYSTEM, rateSystem } from "./prompts";
import { TagResult, rateResultSchema, type RateResult } from "./schemas";

const clamp = (n: number) => Math.min(5, Math.max(1, Math.round(n)));

export async function tagItem(photo: ArrayBuffer): Promise<TagResult> {
  const out = await askJson({
    system: TAG_SYSTEM,
    content: [jpegBlock(photo), { type: "text", text: "Tag this piece." }],
    schema: TagResult,
    effort: "low",
  });
  return {
    ...out,
    name: out.name.trim().slice(0, 80),
    subtype: out.subtype.trim().toLowerCase().replace(/[\s-]+/g, "_").slice(0, 40) || "other",
    brand: out.brand?.trim().slice(0, 60) || null,
    formality: clamp(out.formality),
    warmth: clamp(out.warmth),
    flags: [...new Set(out.flags)],
    note: out.note?.trim() || null,
  };
}

let rulesCache: string | null = null;
function styleRules(): string {
  // Bundled for Vercel via outputFileTracingIncludes in next.config.ts
  rulesCache ??= readFileSync(path.join(process.cwd(), "docs/STYLE_RULES.md"), "utf8");
  return rulesCache;
}

export async function rateFit(photo: ArrayBuffer, occasion: Occasion, closet: Item[]): Promise<RateResult> {
  const available = closet.filter((i) => !i.in_wash);
  if (available.length === 0) throw new AiError("Your closet is empty or all in the wash.", 400);

  // Short refs (i1, i2, ...) are easier for the model than UUIDs; mapped back below.
  const refs = available.map((_, k) => `i${k + 1}`) as [string, ...string[]];
  const refToId = new Map(available.map((it, k) => [refs[k], it.id]));
  const closetList = available
    .map((it, k) => `${refs[k]} | ${it.name} | ${it.color} | ${it.category}/${it.subtype}`)
    .join("\n");

  const out = await askJson({
    system: rateSystem(styleRules()),
    content: [
      jpegBlock(photo),
      {
        type: "text",
        text: `Where I'm going: ${occasion.label} (target formality ${occasion.target_formality}${occasion.notes ? `; ${occasion.notes}` : ""}).

My closet (id | name | color | category/type), pieces in the wash left out:
${closetList}

Rate my fit.`,
      },
    ],
    schema: rateResultSchema(refs),
    effort: "medium",
  });

  return {
    can_rate: out.can_rate,
    score: Math.min(10, Math.max(0, Math.round(out.score))),
    verdict: out.verdict.trim(),
    works: out.works.slice(0, 3),
    change: out.change.slice(0, 3),
    swaps: out.swaps
      .map((s) => ({ item_id: refToId.get(s.item_id) ?? "", reason: s.reason.trim() }))
      .filter((s) => s.item_id)
      .filter((s, k, all) => all.findIndex((x) => x.item_id === s.item_id) === k)
      .slice(0, 3),
  };
}
