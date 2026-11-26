"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Camera, CircleCheck, LoaderCircle, Sparkles } from "lucide-react";
import ItemThumb from "@/components/ItemThumb";
import { aiApi, type RateResponse } from "@/lib/client/api";
import { resizeToJpeg } from "@/lib/client/image";

const chip = "inline-flex h-11 items-center rounded-full border px-4 text-sm font-medium";
const on = "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900";
const off = "border-neutral-200 text-neutral-700 dark:border-neutral-800 dark:text-neutral-300";

export default function RateFit({ occasions }: { occasions: { id: string; label: string }[] }) {
  const [occasionId, setOccasionId] = useState<string | null>(null);
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | "photo" | "rate">(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RateResponse | null>(null);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  async function onPick(file: File | undefined) {
    if (!file) return;
    setError(null);
    setResult(null);
    setBusy("photo");
    try {
      const blob = await resizeToJpeg(file);
      setPhoto(blob);
      setPreview(URL.createObjectURL(blob));
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(null);
  }

  async function onRate() {
    if (!photo || !occasionId) return;
    setError(null);
    setBusy("rate");
    try {
      const { result: r } = await aiApi.rate(photo, occasionId);
      setResult(r);
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(null);
  }

  function reset() {
    setResult(null);
    setPhoto(null);
    setPreview(null);
    setError(null);
  }

  return (
    <div className="flex flex-col gap-5">
      <section>
        <h2 className="mb-2 text-sm font-semibold">Where to?</h2>
        <div className="flex flex-wrap gap-2">
          {occasions.map((o) => (
            <button key={o.id} type="button" aria-pressed={occasionId === o.id} onClick={() => setOccasionId(o.id)} className={`${chip} ${occasionId === o.id ? on : off}`}>
              {o.label}
            </button>
          ))}
        </div>
      </section>

      <label className="relative flex aspect-[3/4] w-full cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-neutral-300 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900">
        {preview ? (
          <>
            <Image src={preview} alt="Your mirror selfie" fill unoptimized sizes="100vw" className="object-cover" />
            <span className="absolute bottom-3 right-3 rounded-full bg-black/70 px-3 py-2 text-sm font-medium text-white">Change photo</span>
          </>
        ) : (
          <span className="flex flex-col items-center gap-2 px-6 text-center text-neutral-500 dark:text-neutral-400">
            {busy === "photo" ? <LoaderCircle className="size-8 animate-spin" aria-hidden /> : <Camera className="size-8" aria-hidden />}
            <span className="text-sm font-medium">{busy === "photo" ? "Preparing photo…" : "Take a mirror selfie"}</span>
            <span className="text-xs">Full outfit in frame, head to shoes</span>
          </span>
        )}
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            void onPick(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </label>

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {!result && (
        <button
          type="button"
          onClick={onRate}
          disabled={!photo || !occasionId || busy !== null}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-neutral-900 text-base font-semibold text-white disabled:opacity-40 dark:bg-white dark:text-neutral-900"
        >
          {busy === "rate" ? <LoaderCircle className="size-5 animate-spin" aria-hidden /> : <Sparkles className="size-5" aria-hidden />}
          {busy === "rate" ? "Looking at your fit…" : !occasionId ? "Pick where you're going" : !photo ? "Add a selfie" : "Rate my fit"}
        </button>
      )}

      {result && <ResultCard r={result} onReset={reset} />}
    </div>
  );
}

function ResultCard({ r, onReset }: { r: RateResponse; onReset: () => void }) {
  const tone =
    !r.can_rate ? "text-neutral-500" : r.score >= 8 ? "text-green-600 dark:text-green-400" : r.score >= 5 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400";
  return (
    <section className="rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800">
      <div className="flex items-center gap-4">
        <p className={`text-5xl font-bold tabular-nums ${tone}`}>
          {r.can_rate ? r.score : "–"}
          <span className="text-lg font-semibold text-neutral-400">/10</span>
        </p>
        <p className="text-lg font-semibold leading-snug">{r.verdict}</p>
      </div>

      {r.works.length > 0 && (
        <ul className="mt-4 flex flex-col gap-1.5 text-sm">
          {r.works.map((w) => (
            <li key={w} className="flex items-start gap-2 text-green-700 dark:text-green-400">
              <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
              {w}
            </li>
          ))}
        </ul>
      )}

      {r.change.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1.5 text-sm">
          {r.change.map((c) => (
            <li key={c} className="flex items-start gap-2 text-orange-600 dark:text-orange-400">
              <ArrowRight className="mt-0.5 size-4 shrink-0" aria-hidden />
              {c}
            </li>
          ))}
        </ul>
      )}

      {r.swaps.length > 0 && (
        <div className="mt-4">
          <h3 className="mb-2 text-sm font-semibold">Swap in from your closet</h3>
          <ul className="flex flex-col gap-2">
            {r.swaps.map((s) => (
              <li key={s.item_id}>
                <Link href={`/closet/${s.item_id}`} className="flex items-center gap-3 rounded-xl border border-neutral-200 p-2 dark:border-neutral-800">
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-lg ring-1 ring-black/5 dark:ring-white/20">
                    <ItemThumb url={s.photoUrl} color={s.color} subtype={s.subtype} alt={s.name} sizes="56px" label={false} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">{s.reason}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button type="button" onClick={onReset} className="mt-5 h-11 w-full rounded-xl border border-neutral-300 text-sm font-semibold dark:border-neutral-700">
        Rate another fit
      </button>
    </section>
  );
}
