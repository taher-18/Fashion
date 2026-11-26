"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, LoaderCircle, Upload } from "lucide-react";

type Counts = { occasions: number; itemsAdded: number; itemsUpdated: number; itemsSkipped: number; outfits: number };

/** Export the closet as JSON, or merge a JSON backup back in. */
export default function BackupPanel() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function onImport(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setMessage(null);
    try {
      const text = await file.text();
      let body: unknown;
      try {
        body = JSON.parse(text);
      } catch {
        throw new Error("That file isn't valid JSON");
      }
      const res = await fetch("/api/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = (await res.json().catch(() => ({}))) as { counts?: Counts; error?: string };
      if (!res.ok || !data.counts) throw new Error(data.error ?? `Import failed (${res.status})`);
      const c = data.counts;
      const parts = [
        `${c.itemsAdded} added`,
        `${c.itemsUpdated} updated`,
        c.itemsSkipped ? `${c.itemsSkipped} skipped (already in your closet)` : null,
        c.occasions ? `${c.occasions} occasions` : null,
        c.outfits ? `${c.outfits} history entries` : null,
      ].filter(Boolean);
      setMessage({ ok: true, text: `Imported: ${parts.join(", ")}.` });
      router.refresh();
    } catch (e) {
      setMessage({ ok: false, text: (e as Error).message });
    }
    setBusy(false);
  }

  const btn = "inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-neutral-300 text-sm font-semibold dark:border-neutral-700";

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        Export saves your items, occasions and history as a JSON file. Import merges a file back in and never deletes anything. Photos stay in Supabase.
      </p>
      <div className="flex gap-3">
        <a href="/api/export" download className={btn}>
          <Download className="size-4" aria-hidden /> Export
        </a>
        <label className={`${btn} cursor-pointer ${busy ? "opacity-50" : ""}`}>
          {busy ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <Upload className="size-4" aria-hidden />}
          Import
          <input
            type="file"
            accept="application/json,.json"
            className="sr-only"
            disabled={busy}
            onChange={(e) => {
              void onImport(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
      </div>
      {message && (
        <p role="status" className={`text-sm ${message.ok ? "text-green-700 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
