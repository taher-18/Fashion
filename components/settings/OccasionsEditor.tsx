"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Pencil, Plus } from "lucide-react";
import { deleteOccasionAction, saveOccasionAction } from "@/app/(app)/settings/actions";
import { shortLabel } from "@/lib/engine/rules";
import { FORMALITY_LABELS } from "@/lib/format";
import type { Occasion } from "@/lib/types";

type Draft = { id?: string; label: string; target_formality: number; strict: boolean; indoor: boolean; notes: string };

const EMPTY: Draft = { label: "", target_formality: 3, strict: false, indoor: false, notes: "" };
const input =
  "h-12 w-full rounded-xl border border-neutral-300 bg-white px-4 text-base outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:border-neutral-300";

export default function OccasionsEditor({ occasions }: { occasions: Occasion[] }) {
  const [editing, setEditing] = useState<string | "new" | null>(null);

  return (
    <div className="flex flex-col gap-2">
      {occasions.map((o) =>
        editing === o.id ? (
          <OccasionForm
            key={o.id}
            initial={{ id: o.id, label: o.label, target_formality: o.target_formality, strict: o.strict, indoor: o.indoor, notes: o.notes ?? "" }}
            onDone={() => setEditing(null)}
          />
        ) : (
          <div key={o.id} className="flex items-center justify-between gap-3 rounded-2xl border border-neutral-200 px-4 py-3 dark:border-neutral-800">
            <div className="min-w-0">
              <p className="font-medium">{shortLabel(o.label)}</p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Formality {o.target_formality}
                {o.strict && " · strict"}
                {o.indoor && " · indoor"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEditing(o.id)}
              aria-label={`Edit ${o.label}`}
              className="flex size-11 shrink-0 items-center justify-center rounded-full border border-neutral-300 dark:border-neutral-700"
            >
              <Pencil className="size-4" aria-hidden />
            </button>
          </div>
        ),
      )}

      {editing === "new" ? (
        <OccasionForm initial={EMPTY} onDone={() => setEditing(null)} />
      ) : (
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-300 text-sm font-semibold dark:border-neutral-700"
        >
          <Plus className="size-4" aria-hidden /> Add occasion
        </button>
      )}
    </div>
  );
}

function OccasionForm({ initial, onDone }: { initial: Draft; onDone: () => void }) {
  const router = useRouter();
  const [d, setD] = useState<Draft>(initial);
  const [busy, setBusy] = useState<null | "save" | "delete">(null);
  const [askDelete, setAskDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((p) => ({ ...p, [k]: v }));

  async function save() {
    setBusy("save");
    setError(null);
    const res = await saveOccasionAction({ ...d, notes: d.notes.trim() || null });
    setBusy(null);
    if (res.error) return setError(res.error);
    router.refresh();
    onDone();
  }

  async function remove() {
    if (!d.id) return;
    setBusy("delete");
    setError(null);
    const res = await deleteOccasionAction(d.id);
    setBusy(null);
    if (res.error) return setError(res.error);
    router.refresh();
    onDone();
  }

  const level = FORMALITY_LABELS[Math.round(d.target_formality) - 1];
  const fid = d.id ?? "new";

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-neutral-900 p-4 dark:border-neutral-300">
      <div>
        <label htmlFor={`occ-label-${fid}`} className="mb-2 block text-sm font-semibold">Name</label>
        <input id={`occ-label-${fid}`} className={input} value={d.label} maxLength={60} onChange={(e) => set("label", e.target.value)} placeholder="Graduation" />
      </div>

      <div>
        <label htmlFor={`occ-formality-${fid}`} className="mb-2 block text-sm font-semibold">
          How dressy <span className="font-normal text-neutral-500">· {d.target_formality} {level}</span>
        </label>
        <input
          id={`occ-formality-${fid}`}
          type="range"
          min={1}
          max={5}
          step={0.5}
          value={d.target_formality}
          onChange={(e) => set("target_formality", Number(e.target.value))}
          className="h-11 w-full accent-neutral-900 dark:accent-white"
        />
      </div>

      <label className="flex min-h-11 items-start gap-3">
        <input type="checkbox" checked={d.strict} onChange={(e) => set("strict", e.target.checked)} className="mt-1 size-5 shrink-0" />
        <span>
          <span className="block text-sm font-semibold">Strict</span>
          <span className="block text-sm text-neutral-500 dark:text-neutral-400">Never pick joggers, ripped jeans or fleece.</span>
        </span>
      </label>

      <label className="flex min-h-11 items-start gap-3">
        <input type="checkbox" checked={d.indoor} onChange={(e) => set("indoor", e.target.checked)} className="mt-1 size-5 shrink-0" />
        <span>
          <span className="block text-sm font-semibold">Indoor</span>
          <span className="block text-sm text-neutral-500 dark:text-neutral-400">Puffers count as bulky unless it&apos;s cold.</span>
        </span>
      </label>

      <div>
        <label htmlFor={`occ-notes-${fid}`} className="mb-2 block text-sm font-semibold">
          Notes <span className="font-normal text-neutral-500">(optional, shown to the AI)</span>
        </label>
        <input id={`occ-notes-${fid}`} className={input} value={d.notes} maxLength={200} onChange={(e) => set("notes", e.target.value)} placeholder="no graphic tees" />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {askDelete ? (
        <div className="rounded-xl border border-red-200 p-3 dark:border-red-900">
          <p className="text-sm font-medium">Delete &ldquo;{shortLabel(d.label)}&rdquo;?</p>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Past outfits stay in History, just without this label.</p>
          <div className="mt-3 flex gap-3">
            <button type="button" onClick={() => setAskDelete(false)} className="h-11 flex-1 rounded-xl border border-neutral-300 text-sm font-semibold dark:border-neutral-700">
              Cancel
            </button>
            <button type="button" onClick={remove} disabled={busy !== null} className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 text-sm font-semibold text-white disabled:opacity-60">
              {busy === "delete" && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
              Yes, delete
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-3">
          {d.id && (
            <button type="button" onClick={() => setAskDelete(true)} className="h-11 rounded-xl px-3 text-sm font-semibold text-red-600 dark:text-red-400">
              Delete
            </button>
          )}
          <button type="button" onClick={onDone} disabled={busy !== null} className="h-11 flex-1 rounded-xl border border-neutral-300 text-sm font-semibold dark:border-neutral-700">
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={busy !== null || !d.label.trim()}
            className="inline-flex h-11 flex-[1.5] items-center justify-center gap-2 rounded-xl bg-neutral-900 text-sm font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
          >
            {busy === "save" && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
            Save
          </button>
        </div>
      )}
    </div>
  );
}
