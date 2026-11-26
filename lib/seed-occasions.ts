// Default occasions from docs/SPEC.md. Used by scripts/seed.mts and the engine tests.

export const SEED_OCCASIONS = [
  { id: "date", label: "Date night", target_formality: 3.5, strict: false, indoor: false, notes: "no joggers, no graphic tees" },
  { id: "family", label: "Her family", target_formality: 4, strict: true, indoor: false, notes: "strict: no ripped jeans, no fleece, no joggers" },
  { id: "friends", label: "Friends", target_formality: 2.5, strict: false, indoor: false, notes: null },
  { id: "cinema", label: "Cinema", target_formality: 3, strict: false, indoor: true, notes: "indoor: avoid puffers unless cold" },
  { id: "uni", label: "Uni", target_formality: 2, strict: false, indoor: false, notes: null },
  { id: "chill", label: "Chill / errands", target_formality: 1.5, strict: false, indoor: false, notes: null },
  { id: "semi_formal", label: "Semi-formal (Katb Ketab, events)", target_formality: 4.5, strict: false, indoor: false, notes: "needs shirt; blazer if owned" },
].map((o, i) => ({ ...o, sort_order: i }));
