"use client";

import { useState } from "react";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { outfitApi } from "@/lib/client/api";

/** Thumbs up / down for a worn outfit. Tapping the active thumb clears it. */
export default function RateButtons({ id, rating: initial }: { id: string; rating: number | null }) {
  const [rating, setRating] = useState<number>(initial ?? 0);
  const [error, setError] = useState(false);

  async function rate(next: -1 | 1) {
    const value: -1 | 0 | 1 = rating === next ? 0 : next;
    const before = rating;
    setRating(value);
    setError(false);
    try {
      await outfitApi.rate(id, value);
    } catch {
      setRating(before);
      setError(true);
    }
  }

  const base = "flex size-11 items-center justify-center rounded-full border";
  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-xs text-red-600 dark:text-red-400">Didn&apos;t save</span>}
      <button
        type="button"
        aria-label="Thumbs up"
        aria-pressed={rating === 1}
        onClick={() => rate(1)}
        className={`${base} ${rating === 1 ? "border-green-600 bg-green-600 text-white" : "border-neutral-300 text-neutral-500 dark:border-neutral-700"}`}
      >
        <ThumbsUp className="size-5" aria-hidden />
      </button>
      <button
        type="button"
        aria-label="Thumbs down"
        aria-pressed={rating === -1}
        onClick={() => rate(-1)}
        className={`${base} ${rating === -1 ? "border-orange-500 bg-orange-500 text-white" : "border-neutral-300 text-neutral-500 dark:border-neutral-700"}`}
      >
        <ThumbsDown className="size-5" aria-hidden />
      </button>
    </div>
  );
}
