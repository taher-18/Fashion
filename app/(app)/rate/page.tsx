import { connection } from "next/server";
import { Sparkles } from "lucide-react";
import RateFit from "@/components/RateFit";
import { aiStatus } from "@/lib/ai/client";
import { dbConfigured } from "@/lib/db/client";
import { listOccasions } from "@/lib/db/occasions";
import { shortLabel } from "@/lib/engine/rules";

export default async function RatePage() {
  await connection(); // read the AI env at request time, not build time
  const ai = await aiStatus();

  return (
    <main className="px-4 pt-[max(1rem,env(safe-area-inset-top))]">
      <h1 className="text-2xl font-semibold tracking-tight">Rate my fit</h1>
      <p className="mb-5 mt-1 text-sm text-neutral-500 dark:text-neutral-400">Mirror selfie in, honest verdict out.</p>
      {!ai.enabled ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 p-6 text-center dark:border-neutral-700">
          <Sparkles className="mx-auto size-6 text-neutral-400" aria-hidden />
          <p className="mt-2 font-medium">AI is off</p>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{ai.reason}</p>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Today, Closet and History still work without it.</p>
        </div>
      ) : !dbConfigured() ? (
        <p className="text-sm text-neutral-500">Supabase isn&apos;t set up yet.</p>
      ) : (
        <RateFit occasions={(await listOccasions()).map((o) => ({ id: o.id, label: shortLabel(o.label) }))} />
      )}
    </main>
  );
}
