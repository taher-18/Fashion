// Browser-side fetch helpers. Throw an Error with the server's message on failure.

import type { Item } from "@/lib/types";

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch {
    throw new Error("Can't reach the server");
  }
  if (res.status === 401) {
    window.location.replace("/login"); // full reload: session is gone
    throw new Error("Logged out");
  }
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(data.error ?? `Something went wrong (${res.status})`);
  return data;
}

const json = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export type ItemBody = Omit<Item, "id" | "created_at">;

export const api = {
  createItem: (body: Partial<ItemBody>) => call<{ item: Item }>("/api/items", json("POST", body)),
  updateItem: (id: string, body: Partial<ItemBody>) => call<{ item: Item }>(`/api/items/${id}`, json("PATCH", body)),
  deleteItem: (id: string) => call<{ ok: true }>(`/api/items/${id}`, { method: "DELETE" }),
  uploadPhoto: (blob: Blob) => {
    const form = new FormData();
    form.append("file", blob, "photo.jpg");
    return call<{ path: string; url: string | null }>("/api/items/upload", { method: "POST", body: form });
  },
};

export const outfitApi = {
  wear: (body: { item_ids: string[]; occasion_id: string | null; weather: string | null }) =>
    call<{ outfit: { id: string } }>("/api/outfits/wear", json("POST", body)),
  rate: (id: string, rating: -1 | 0 | 1) => call<{ outfit: { id: string; rating: number } }>(`/api/outfits/${id}`, json("PATCH", { rating })),
};

export type TagSuggestion = {
  is_clothing: boolean;
  name: string;
  category: Item["category"];
  subtype: string;
  color: Item["color"];
  brand: string | null;
  formality: number;
  warmth: number;
  fit: Item["fit"];
  flags: string[];
  note: string | null;
};

export type RateSwap = { item_id: string; reason: string; name: string; color: Item["color"]; subtype: string; photoUrl: string | null };
export type RateResponse = {
  can_rate: boolean;
  score: number;
  verdict: string;
  works: string[];
  change: string[];
  swaps: RateSwap[];
};

export const aiApi = {
  tag: (blob: Blob) => {
    const form = new FormData();
    form.append("file", blob, "item.jpg");
    return call<{ tag: TagSuggestion }>("/api/ai/tag", { method: "POST", body: form });
  },
  rate: (blob: Blob, occasionId: string) => {
    const form = new FormData();
    form.append("file", blob, "selfie.jpg");
    form.append("occasion_id", occasionId);
    return call<{ result: RateResponse }>("/api/ai/rate", { method: "POST", body: form });
  },
};
