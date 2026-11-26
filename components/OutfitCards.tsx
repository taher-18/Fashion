"use client";

import Link from "next/link";
import { useState } from "react";
import { CircleCheck, LoaderCircle, TriangleAlert } from "lucide-react";
import PieceRow from "@/components/PieceRow";
import { outfitApi } from "@/lib/client/api";
import type { SuggestionView } from "@/lib/suggestions";
import type { Weather } from "@/lib/types";

const BADGES = ["Best pick", "Second", "Third"];

export default function OutfitCards({
  outfits,
  occasionId,
  weather,
}: {
  outfits: SuggestionView[];
  occasionId: string;
  weather: Weather;
}) {
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());
  const [wornIdx, setWornIdx] = useState<number | null>(null);
  const [busyIdx, setBusyIdx] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const visible = outfits.map((o, idx) => ({ o, idx })).filter(({ idx }) => !dismissed.has(idx)).slice(0, 3);

  async function wear(idx: number) {
    setBusyIdx(idx);
    setError(null);
    try {
      await outfitApi.wear({ item_ids: outfits[idx].itemIds, occasion_id: occasionId, weather });
      setWornIdx(idx);
    } catch (e) {
      setError((e as Error).message);
    }
    setBusyIdx(null);
  }

  if (visible.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 p-6 text-center dark:border-neutral-700">
        <p className="font-medium">That&apos;s all the good ones</p>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Try another occasion, weather, or Build around piece.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      {visible.map(({ o, idx }, pos) => {
        const worn = wornIdx === idx;
        return (
          <article key={o.itemIds.join("|")} className="rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800">
            <span
              className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                pos === 0
                  ? "bg-green-600 text-white"
                  : "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
              }`}
            >
              {BADGES[pos]}
            </span>

            <div className="mt-3">
              <PieceRow pieces={o.pieces} />
            </div>

            {(o.positives.length > 0 || o.warnings.length > 0) && (
              <ul className="mt-3 flex flex-col gap-1.5 text-sm">
                {o.positives.map((r) => (
                  <li key={r.text} className="flex items-start gap-2 text-green-700 dark:text-green-400">
                    <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
                    {r.text}
                  </li>
                ))}
                {o.warnings.map((r) => (
                  <li key={r.text} className="flex items-start gap-2 text-orange-600 dark:text-orange-400">
                    <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                    {r.text}
                  </li>
                ))}
              </ul>
            )}

            {worn ? (
              <p className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-800 dark:bg-green-950/50 dark:text-green-300">
                Logged. Have a good one!{" "}
                <Link href="/history" className="underline">
                  See history
                </Link>
              </p>
            ) : (
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => wear(idx)}
                  disabled={busyIdx !== null || wornIdx !== null}
                  className="inline-flex h-11 flex-[2] items-center justify-center gap-2 rounded-xl bg-neutral-900 text-sm font-semibold text-white disabled:opacity-40 dark:bg-white dark:text-neutral-900"
                >
                  {busyIdx === idx && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
                  I&apos;m wearing this
                </button>
                <button
                  type="button"
                  onClick={() => setDismissed((prev) => new Set(prev).add(idx))}
                  disabled={busyIdx !== null}
                  className="h-11 flex-1 rounded-xl border border-neutral-300 text-sm font-semibold dark:border-neutral-700"
                >
                  Not this
                </button>
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
