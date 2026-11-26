"use client";

import Image from "next/image";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Camera, LoaderCircle, Sparkles } from "lucide-react";
import Swatch from "@/components/Swatch";
import { aiApi, api, type TagSuggestion } from "@/lib/client/api";
import { resizeToJpeg } from "@/lib/client/image";
import { COLOR_INFO } from "@/lib/engine/colors";
import { FORMALITY_LABELS, SUBTYPE_SUGGESTIONS, WARMTH_LABELS, pretty } from "@/lib/format";
import { CATEGORIES, CATEGORY_LABELS, COLORS, FITS, FLAGS, type Category, type Color, type Fit, type Flag, type Item } from "@/lib/types";

const FLAG_LABELS: Record<Flag, string> = {
  ripped: "Ripped",
  graphic: "Graphic print",
  hooded: "Has a hood",
  bulky: "Bulky",
  logo_big: "Big logo",
};

type Draft = {
  name: string;
  brand: string;
  category: Category;
  subtype: string;
  color: Color;
  formality: number;
  warmth: number;
  fit: Fit | null;
  flags: Flag[];
  notes: string;
};

function draftFrom(item?: Item): Draft {
  return {
    name: item?.name ?? "",
    brand: item?.brand ?? "",
    category: item?.category ?? "base",
    subtype: item?.subtype ?? "",
    color: item?.color ?? "white",
    formality: item?.formality ?? 3,
    warmth: item?.warmth ?? 2,
    fit: item?.fit ?? null,
    flags: (item?.flags ?? []).filter((f): f is Flag => (FLAGS as readonly string[]).includes(f)),
    notes: item?.notes ?? "",
  };
}

const label = "mb-2 block text-sm font-semibold";
const input =
  "h-12 w-full rounded-xl border border-neutral-300 bg-white px-4 text-base outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:border-neutral-300";
const chip = "inline-flex h-11 items-center rounded-full border px-4 text-sm font-medium";
const on = "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900";
const off = "border-neutral-200 text-neutral-700 dark:border-neutral-800 dark:text-neutral-300";

export default function ItemForm({
  item,
  photoUrl,
  ai,
  onSaved,
  onCancel,
}: {
  item?: Item;
  photoUrl?: string | null;
  /** Add screen only: shows the "Auto-tag with AI" button (or why AI is off). */
  ai?: { enabled: true } | { enabled: false; reason: string };
  /** Edit mode callback. In add mode (no item) the form opens the new item page itself. */
  onSaved?: (item: Item, photoUrl: string | null) => void;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const [d, setD] = useState<Draft>(() => draftFrom(item));
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | "photo" | "save" | "tag">(null);
  const [error, setError] = useState<string | null>(null);
  const [aiNote, setAiNote] = useState<string | null>(null);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((prev) => ({ ...prev, [k]: v }));

  async function onPickPhoto(file: File | undefined) {
    if (!file) return;
    setError(null);
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

  async function onAutoTag() {
    if (!photo) return;
    setError(null);
    setAiNote(null);
    setBusy("tag");
    try {
      const { tag } = await aiApi.tag(photo);
      applyTag(tag);
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(null);
  }

  function applyTag(t: TagSuggestion) {
    setD((prev) => ({
      ...prev,
      name: t.name || prev.name,
      brand: t.brand ?? "",
      category: t.category,
      subtype: t.subtype,
      color: t.color,
      formality: t.formality,
      warmth: t.warmth,
      fit: t.fit,
      flags: t.flags.filter((f): f is Flag => (FLAGS as readonly string[]).includes(f)),
    }));
    const base = t.is_clothing ? "Filled in by AI. Check it before saving." : "That doesn't look like clothing, so double-check everything.";
    setAiNote(t.note ? `${base} ${t.note}` : base);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!d.name.trim()) return setError("Give it a name");
    if (!d.subtype.trim()) return setError("Pick a type");
    setError(null);
    setBusy("save");
    try {
      let photo_path = item?.photo_path ?? null;
      let newUrl: string | null = photoUrl ?? null;
      if (photo) {
        const up = await api.uploadPhoto(photo);
        photo_path = up.path;
        newUrl = up.url;
      }
      const body = {
        ...d,
        brand: d.brand.trim() || null,
        notes: d.notes.trim() || null,
        photo_path,
      };
      if (item) {
        const { item: saved } = await api.updateItem(item.id, body);
        onSaved?.(saved, newUrl);
        router.refresh();
        setBusy(null);
      } else {
        const { item: saved } = await api.createItem(body);
        router.replace(`/closet/${saved.id}`);
      }
    } catch (err) {
      setError((err as Error).message);
      setBusy(null);
    }
  }

  const shownPhoto = preview ?? photoUrl ?? null;
  const suggestions = SUBTYPE_SUGGESTIONS[d.category] ?? [];

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      {/* Photo */}
      <div>
        <label className="relative flex aspect-square w-full cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-neutral-300 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900">
          {shownPhoto ? (
            <>
              <Image src={shownPhoto} alt="Item photo" fill unoptimized sizes="100vw" className="object-cover" />
              <span className="absolute bottom-3 right-3 rounded-full bg-black/70 px-3 py-2 text-sm font-medium text-white">
                Change photo
              </span>
            </>
          ) : (
            <span className="flex flex-col items-center gap-2 text-neutral-500 dark:text-neutral-400">
              {busy === "photo" ? (
                <LoaderCircle className="size-8 animate-spin" aria-hidden />
              ) : (
                <Camera className="size-8" aria-hidden />
              )}
              <span className="text-sm font-medium">{busy === "photo" ? "Preparing photo…" : "Take or choose a photo"}</span>
              <span className="text-xs">Optional</span>
            </span>
          )}
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              void onPickPhoto(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
      </div>

      {ai && (
        <div className="-mt-3">
          {ai.enabled ? (
            <button
              type="button"
              onClick={onAutoTag}
              disabled={!photo || busy !== null}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-violet-300 bg-violet-50 text-base font-semibold text-violet-900 disabled:opacity-50 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-200"
            >
              {busy === "tag" ? <LoaderCircle className="size-5 animate-spin" aria-hidden /> : <Sparkles className="size-5" aria-hidden />}
              {busy === "tag" ? "Looking at it…" : photo ? "Auto-tag with AI" : "Add a photo to auto-tag"}
            </button>
          ) : (
            <p className="rounded-xl bg-neutral-100 px-4 py-3 text-sm text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400">
              <Sparkles className="mr-1.5 inline size-4 align-[-3px]" aria-hidden />
              AI is off. {ai.reason} You can still fill it in by hand.
            </p>
          )}
          {aiNote && <p className="mt-2 text-sm text-violet-700 dark:text-violet-300">{aiNote}</p>}
        </div>
      )}

      {/* Name + brand */}
      <div>
        <label htmlFor="name" className={label}>Name</label>
        <input id="name" className={input} value={d.name} onChange={(e) => set("name", e.target.value)} placeholder="White tee" maxLength={80} />
      </div>
      <div>
        <label htmlFor="brand" className={label}>Brand <span className="font-normal text-neutral-500">(optional)</span></label>
        <input id="brand" className={input} value={d.brand} onChange={(e) => set("brand", e.target.value)} placeholder="Tommy Hilfiger" maxLength={60} />
      </div>

      {/* Category */}
      <fieldset>
        <legend className={label}>Category</legend>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button key={c} type="button" aria-pressed={d.category === c} onClick={() => set("category", c)} className={`${chip} ${d.category === c ? on : off}`}>
              {CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Type */}
      <div>
        <label htmlFor="subtype" className={label}>Type</label>
        <input id="subtype" className={input} value={d.subtype} onChange={(e) => set("subtype", e.target.value)} placeholder="tee, jeans, sneakers…" maxLength={40} autoCapitalize="none" />
        <div className="mt-2 flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button key={s} type="button" onClick={() => set("subtype", s)} className={`${chip} ${d.subtype === s ? on : off}`}>
              {pretty(s)}
            </button>
          ))}
        </div>
      </div>

      {/* Color */}
      <fieldset>
        <legend className={label}>
          Color <span className="font-normal text-neutral-500">· {COLOR_INFO[d.color].label}</span>
        </legend>
        <div className="grid grid-cols-6 gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={COLOR_INFO[c].label}
              aria-pressed={d.color === c}
              onClick={() => set("color", c)}
              className={`flex h-12 items-center justify-center rounded-xl ${d.color === c ? "ring-2 ring-neutral-900 dark:ring-white" : ""}`}
            >
              <Swatch color={c} className="size-8" />
            </button>
          ))}
        </div>
      </fieldset>

      <Scale legend="Formality" value={d.formality} labels={FORMALITY_LABELS} onChange={(v) => set("formality", v)} />
      <Scale legend="Warmth" value={d.warmth} labels={WARMTH_LABELS} onChange={(v) => set("warmth", v)} />

      {/* Fit */}
      <fieldset>
        <legend className={label}>Fit <span className="font-normal text-neutral-500">(optional)</span></legend>
        <div className="flex flex-wrap gap-2">
          <button type="button" aria-pressed={d.fit === null} onClick={() => set("fit", null)} className={`${chip} ${d.fit === null ? on : off}`}>
            Not set
          </button>
          {FITS.map((f) => (
            <button key={f} type="button" aria-pressed={d.fit === f} onClick={() => set("fit", f)} className={`${chip} ${d.fit === f ? on : off}`}>
              {pretty(f)}
            </button>
          ))}
        </div>
      </fieldset>

      {/* Flags */}
      <fieldset>
        <legend className={label}>Details</legend>
        <div className="flex flex-wrap gap-2">
          {FLAGS.map((f) => {
            const active = d.flags.includes(f);
            return (
              <button
                key={f}
                type="button"
                aria-pressed={active}
                onClick={() => set("flags", active ? d.flags.filter((x) => x !== f) : [...d.flags, f])}
                className={`${chip} ${active ? on : off}`}
              >
                {FLAG_LABELS[f]}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div>
        <label htmlFor="notes" className={label}>Notes <span className="font-normal text-neutral-500">(optional)</span></label>
        <textarea
          id="notes"
          rows={3}
          maxLength={500}
          value={d.notes}
          onChange={(e) => set("notes", e.target.value)}
          className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:border-neutral-300"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        {onCancel && (
          <button type="button" onClick={onCancel} disabled={busy === "save"} className="h-12 flex-1 rounded-xl border border-neutral-300 text-base font-semibold dark:border-neutral-700">
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={busy !== null}
          className="inline-flex h-12 flex-[2] items-center justify-center gap-2 rounded-xl bg-neutral-900 text-base font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
        >
          {busy === "save" && <LoaderCircle className="size-5 animate-spin" aria-hidden />}
          {busy === "save" ? "Saving…" : item ? "Save changes" : "Save item"}
        </button>
      </div>
    </form>
  );
}

function Scale({
  legend,
  value,
  labels,
  onChange,
}: {
  legend: string;
  value: number;
  labels: readonly string[];
  onChange: (v: number) => void;
}) {
  return (
    <fieldset>
      <legend className={label}>
        {legend} <span className="font-normal text-neutral-500">· {value} {labels[value - 1]}</span>
      </legend>
      <div className="grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${n} ${labels[n - 1]}`}
            aria-pressed={value === n}
            onClick={() => onChange(n)}
            className={`h-11 rounded-xl border text-base font-semibold ${value === n ? on : off}`}
          >
            {n}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
