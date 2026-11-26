"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setAiEnabled } from "@/app/(app)/settings/actions";

/** Per-device AI on/off. Needs ANTHROPIC_API_KEY + ANTHROPIC_MODEL to be set first. */
export default function AiSwitch({
  configured,
  reason,
  model,
  on: initial,
}: {
  configured: boolean;
  reason: string | null;
  model: string | null;
  on: boolean;
}) {
  const router = useRouter();
  const [on, setOn] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const active = configured && on;

  async function toggle() {
    const next = !on;
    setOn(next);
    setBusy(true);
    setError(null);
    const res = await setAiEnabled(next);
    if (res.error) {
      setOn(!next);
      setError(res.error);
    }
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800">
      <button
        type="button"
        role="switch"
        aria-checked={active}
        disabled={!configured || busy}
        onClick={toggle}
        className="flex min-h-14 w-full items-center justify-between gap-4 px-4 py-3 text-left disabled:cursor-not-allowed"
      >
        <span>
          <span className="block font-medium">Auto-tag and Rate my fit</span>
          <span className="block text-sm text-neutral-500 dark:text-neutral-400">
            {!configured ? `Off. ${reason}` : on ? `On · ${model}` : "Off on this device. Everything else still works."}
          </span>
        </span>
        <span className={`relative h-8 w-13 shrink-0 rounded-full transition-colors ${active ? "bg-green-600" : "bg-neutral-300 dark:bg-neutral-700"}`}>
          <span className={`absolute top-1 size-6 rounded-full bg-white shadow transition-all ${active ? "left-6" : "left-1"}`} />
        </span>
      </button>
      {error && (
        <p role="alert" className="px-4 pb-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
