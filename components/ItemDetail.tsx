"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, LoaderCircle, Pencil, ShieldQuestion, Trash2 } from "lucide-react";
import ItemForm from "@/components/ItemForm";
import ItemThumb from "@/components/ItemThumb";
import Swatch from "@/components/Swatch";
import { api } from "@/lib/client/api";
import type { WearStats } from "@/lib/db/items";
import { COLOR_INFO } from "@/lib/engine/colors";
import { FORMALITY_LABELS, WARMTH_LABELS, formatDate, pretty } from "@/lib/format";
import { CATEGORY_LABELS, type Item } from "@/lib/types";

export default function ItemDetail({
  item: initial,
  photoUrl: initialUrl,
  stats,
}: {
  item: Item;
  photoUrl: string | null;
  stats: WearStats;
}) {
  const router = useRouter();
  const [item, setItem] = useState(initial);
  const [photoUrl, setPhotoUrl] = useState(initialUrl);
  const [editing, setEditing] = useState(false);
  const [askDelete, setAskDelete] = useState(false);
  const [busy, setBusy] = useState<null | "wash" | "confirm" | "delete">(null);
  const [error, setError] = useState<string | null>(null);

  async function patch(kind: "wash" | "confirm", body: Partial<Item>, optimistic: Item) {
    const before = item;
    setItem(optimistic);
    setBusy(kind);
    setError(null);
    try {
      const { item: saved } = await api.updateItem(item.id, body);
      setItem(saved);
    } catch (e) {
      setItem(before);
      setError((e as Error).message);
    }
    setBusy(null);
  }

  async function onDelete() {
    setBusy("delete");
    setError(null);
    try {
      await api.deleteItem(item.id);
      router.replace("/closet");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      setBusy(null);
    }
  }

  if (editing) {
    return (
      <main className="px-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <h1 className="mb-4 text-2xl font-semibold tracking-tight">Edit item</h1>
        <ItemForm
          item={item}
          photoUrl={photoUrl}
          onCancel={() => setEditing(false)}
          onSaved={(saved, url) => {
            setItem(saved);
            setPhotoUrl(url);
            setEditing(false);
          }}
        />
      </main>
    );
  }

  const rows: [string, React.ReactNode][] = [
    ["Category", CATEGORY_LABELS[item.category]],
    ["Type", pretty(item.subtype)],
    [
      "Color",
      <span key="c" className="inline-flex items-center gap-2">
        <Swatch color={item.color} className="size-4" />
        {COLOR_INFO[item.color].label}
      </span>,
    ],
    ["Formality", `${item.formality} · ${FORMALITY_LABELS[item.formality - 1]}`],
    ["Warmth", `${item.warmth} · ${WARMTH_LABELS[item.warmth - 1]}`],
    ["Fit", item.fit ? pretty(item.fit) : "Not set"],
  ];
  if (item.flags.length) rows.push(["Details", item.flags.map(pretty).join(", ")]);

  return (
    <main className="px-4 pt-[max(0.5rem,env(safe-area-inset-top))]">
      <Link href="/closet" className="-ml-2 inline-flex h-11 items-center gap-1 px-2 text-sm font-medium text-neutral-500 dark:text-neutral-400">
        <ChevronLeft className="size-5" aria-hidden /> Closet
      </Link>

      <div className="relative mt-1 aspect-square overflow-hidden rounded-2xl bg-neutral-100 ring-1 ring-black/5 dark:bg-neutral-900 dark:ring-white/20">
        <ItemThumb url={photoUrl} color={item.color} subtype={item.subtype} alt={item.name} sizes="100vw" priority />
      </div>

      <h1 className="mt-4 text-2xl font-semibold tracking-tight">{item.name}</h1>
      {item.brand && <p className="text-neutral-500 dark:text-neutral-400">{item.brand}</p>}

      {item.needs_confirm && (
        <div className="mt-4 rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:ring-amber-900">
          <p className="flex items-center gap-2 font-semibold text-amber-900 dark:text-amber-200">
            <ShieldQuestion className="size-5" aria-hidden /> Confirm this item
          </p>
          <p className="mt-1 text-sm text-amber-900/80 dark:text-amber-200/80">
            It came from your notes and might be a duplicate or not yours. Fix anything with Edit, or delete it.
          </p>
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => patch("confirm", { needs_confirm: false }, { ...item, needs_confirm: false })}
            className="mt-3 h-11 rounded-xl bg-amber-900 px-4 text-sm font-semibold text-white disabled:opacity-50 dark:bg-amber-200 dark:text-amber-950"
          >
            Yes, I own it
          </button>
        </div>
      )}

      {/* In wash toggle */}
      <button
        type="button"
        role="switch"
        aria-checked={item.in_wash}
        disabled={busy === "wash"}
        onClick={() => patch("wash", { in_wash: !item.in_wash }, { ...item, in_wash: !item.in_wash })}
        className="mt-4 flex min-h-14 w-full items-center justify-between rounded-2xl border border-neutral-200 px-4 dark:border-neutral-800"
      >
        <span className="text-left">
          <span className="block font-medium">In wash</span>
          <span className="block text-sm text-neutral-500 dark:text-neutral-400">
            {item.in_wash ? "Left out of outfit picks" : "Available for outfits"}
          </span>
        </span>
        <span className={`relative h-8 w-13 shrink-0 rounded-full transition-colors ${item.in_wash ? "bg-sky-600" : "bg-neutral-300 dark:bg-neutral-700"}`}>
          <span className={`absolute top-1 size-6 rounded-full bg-white shadow transition-all ${item.in_wash ? "left-6" : "left-1"}`} />
        </span>
      </button>

      <dl className="mt-4 divide-y divide-neutral-200 rounded-2xl border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between gap-4 px-4 py-3">
            <dt className="text-sm text-neutral-500 dark:text-neutral-400">{k}</dt>
            <dd className="text-right text-sm font-medium">{v}</dd>
          </div>
        ))}
      </dl>

      <dl className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800">
          <dt className="text-sm text-neutral-500 dark:text-neutral-400">Times worn</dt>
          <dd className="mt-1 text-xl font-semibold">{stats.timesWorn}</dd>
        </div>
        <div className="rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800">
          <dt className="text-sm text-neutral-500 dark:text-neutral-400">Last worn</dt>
          <dd className="mt-1 text-xl font-semibold">{stats.lastWorn ? formatDate(stats.lastWorn) : "Never"}</dd>
        </div>
      </dl>

      {item.notes && (
        <div className="mt-4 rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Notes</p>
          <p className="mt-1 whitespace-pre-wrap text-sm">{item.notes}</p>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-4 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {askDelete ? (
        <div className="mt-6 rounded-2xl border border-red-200 p-4 dark:border-red-900">
          <p className="font-medium">Delete &ldquo;{item.name}&rdquo; for good?</p>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">The photo goes too. This can&apos;t be undone.</p>
          <div className="mt-3 flex gap-3">
            <button type="button" onClick={() => setAskDelete(false)} disabled={busy === "delete"} className="h-11 flex-1 rounded-xl border border-neutral-300 text-sm font-semibold dark:border-neutral-700">
              Cancel
            </button>
            <button type="button" onClick={onDelete} disabled={busy === "delete"} className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 text-sm font-semibold text-white disabled:opacity-60">
              {busy === "delete" && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
              Yes, delete
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-6 flex gap-3">
          <button type="button" onClick={() => setEditing(true)} className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-neutral-900 text-base font-semibold text-white dark:bg-white dark:text-neutral-900">
            <Pencil className="size-4" aria-hidden /> Edit
          </button>
          <button type="button" onClick={() => setAskDelete(true)} className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-neutral-300 text-base font-semibold text-red-600 dark:border-neutral-700 dark:text-red-400">
            <Trash2 className="size-4" aria-hidden /> Delete
          </button>
        </div>
      )}
    </main>
  );
}
