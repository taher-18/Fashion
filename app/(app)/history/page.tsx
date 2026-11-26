import Link from "next/link";
import { connection } from "next/server";
import PieceRow, { type Piece } from "@/components/PieceRow";
import RateButtons from "@/components/RateButtons";
import { dbConfigured } from "@/lib/db/client";
import { listItems } from "@/lib/db/items";
import { listOccasions } from "@/lib/db/occasions";
import { listWorn } from "@/lib/db/outfits";
import { signPhotoUrls } from "@/lib/db/storage";
import { shortLabel } from "@/lib/engine/rules";
import { formatDate, pretty } from "@/lib/format";

export default async function HistoryPage() {
  await connection(); // always fresh, never prerendered at build time
  if (!dbConfigured()) {
    return <p className="p-5 text-sm text-neutral-500">Supabase isn&apos;t set up yet. Add the keys to .env.local.</p>;
  }

  const [worn, items, occasions] = await Promise.all([listWorn(60), listItems(), listOccasions()]);
  const byId = new Map(items.map((i) => [i.id, i]));
  const occLabel = new Map(occasions.map((o) => [o.id, shortLabel(o.label)]));
  const urls = await signPhotoUrls(worn.flatMap((w) => w.item_ids).map((id) => byId.get(id)?.photo_path ?? null));

  // Group by day, newest first (listWorn is already sorted)
  const days: { date: string; entries: typeof worn }[] = [];
  for (const w of worn) {
    const last = days.at(-1);
    if (last && last.date === w.worn_on) last.entries.push(w);
    else days.push({ date: w.worn_on, entries: [w] });
  }

  return (
    <main className="px-4 pt-[max(1rem,env(safe-area-inset-top))]">
      <h1 className="text-2xl font-semibold tracking-tight">History</h1>
      <p className="text-sm text-neutral-500 dark:text-neutral-400">Thumbs up or down to teach your picks.</p>

      {days.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-neutral-300 p-6 text-center dark:border-neutral-700">
          <p className="font-medium">Nothing logged yet</p>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Tap &ldquo;I&apos;m wearing this&rdquo; on{" "}
            <Link href="/" className="underline">
              Today
            </Link>
            .
          </p>
        </div>
      ) : (
        days.map((day) => (
          <section key={day.date} className="mt-6">
            <h2 className="mb-2 text-sm font-semibold text-neutral-500 dark:text-neutral-400">{formatDate(day.date)}</h2>
            <div className="flex flex-col gap-3">
              {day.entries.map((w) => {
                const pieces: Piece[] = w.item_ids.flatMap((id) => {
                  const it = byId.get(id);
                  if (!it) return [];
                  return [{ id, name: it.name, subtype: it.subtype, color: it.color, photoUrl: it.photo_path ? urls[it.photo_path] ?? null : null }];
                });
                const missing = w.item_ids.length - pieces.length;
                return (
                  <article key={w.id} className="rounded-2xl border border-neutral-200 p-4 dark:border-neutral-800">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="text-sm font-medium">
                        {(w.occasion_id && occLabel.get(w.occasion_id)) ?? "Outfit"}
                        {w.weather && <span className="font-normal text-neutral-500 dark:text-neutral-400"> · {pretty(w.weather)}</span>}
                      </p>
                      <RateButtons id={w.id} rating={w.rating} />
                    </div>
                    <PieceRow pieces={pieces} />
                    {missing > 0 && (
                      <p className="mt-2 text-xs text-neutral-500">
                        {missing} deleted item{missing > 1 ? "s" : ""}
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        ))
      )}
    </main>
  );
}
