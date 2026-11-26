import Link from "next/link";
import { Suspense } from "react";
import { CloudSun, Settings, Snowflake, Sun, SunDim } from "lucide-react";
import AnchorPicker from "@/components/AnchorPicker";
import OutfitCards from "@/components/OutfitCards";
import { dbConfigured } from "@/lib/db/client";
import { listItems } from "@/lib/db/items";
import { listOccasions } from "@/lib/db/occasions";
import { shortLabel } from "@/lib/engine/rules";
import { defaultWeather, getSuggestions } from "@/lib/suggestions";
import { WEATHERS, type Item, type Occasion, type Weather } from "@/lib/types";
import { Uuid } from "@/lib/validation";

type SP = Promise<Record<string, string | string[] | undefined>>;

const WEATHER_UI: Record<Weather, { label: string; icon: typeof Sun }> = {
  hot: { label: "Hot", icon: Sun },
  warm: { label: "Warm", icon: SunDim },
  mild: { label: "Mild", icon: CloudSun },
  cold: { label: "Cold", icon: Snowflake },
};

const chip = "inline-flex h-11 items-center justify-center gap-1.5 rounded-full border px-4 text-sm font-medium";
const on = "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900";
const off = "border-neutral-200 text-neutral-700 dark:border-neutral-800 dark:text-neutral-300";

export default async function TodayPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

  if (!dbConfigured()) {
    return <p className="p-5 text-sm text-neutral-500">Supabase isn&apos;t set up yet. Add the keys to .env.local.</p>;
  }

  const [occasions, items] = await Promise.all([listOccasions(), listItems()]);
  const occasion = occasions.find((o) => o.id === one(sp.occasion)) ?? null;
  const w = one(sp.weather);
  const weather: Weather = WEATHERS.includes(w as Weather) ? (w as Weather) : defaultWeather();
  const a = one(sp.anchor);
  const available = items.filter((i) => !i.in_wash);
  const anchorId = a && Uuid.safeParse(a).success && available.some((i) => i.id === a) ? a : null;

  const href = (change: { occasion?: string; weather?: Weather }) => {
    const q = new URLSearchParams();
    const occ = change.occasion ?? occasion?.id;
    if (occ) q.set("occasion", occ);
    q.set("weather", change.weather ?? weather);
    if (anchorId) q.set("anchor", anchorId);
    return `/?${q.toString()}`;
  };
  const params: Record<string, string> = { weather, ...(occasion ? { occasion: occasion.id } : {}) };
  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short", timeZone: "Africa/Cairo" });

  return (
    <main className="px-4 pt-[max(1rem,env(safe-area-inset-top))]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Today</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{today}</p>
        </div>
        <Link
          href="/settings"
          aria-label="Settings"
          className="flex size-11 items-center justify-center rounded-full border border-neutral-200 text-neutral-600 dark:border-neutral-800 dark:text-neutral-300"
        >
          <Settings className="size-5" aria-hidden />
        </Link>
      </div>

      <section className="mt-5">
        <h2 className="mb-2 text-sm font-semibold">Where to?</h2>
        <div className="flex flex-wrap gap-2">
          {occasions.map((o) => (
            <Link key={o.id} href={href({ occasion: o.id })} scroll={false} aria-pressed={occasion?.id === o.id} className={`${chip} ${occasion?.id === o.id ? on : off}`}>
              {shortLabel(o.label)}
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-5">
        <h2 className="mb-2 text-sm font-semibold">Weather</h2>
        <div className="grid grid-cols-4 gap-2">
          {WEATHERS.map((wx) => {
            const { label, icon: Icon } = WEATHER_UI[wx];
            return (
              <Link key={wx} href={href({ weather: wx })} scroll={false} aria-pressed={weather === wx} className={`${chip} px-2 ${weather === wx ? on : off}`}>
                <Icon className="size-4" aria-hidden />
                {label}
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-5">
        <h2 className="mb-2 text-sm font-semibold">
          Build around <span className="font-normal text-neutral-500">(optional)</span>
        </h2>
        <AnchorPicker items={available.map(({ id, name, category }) => ({ id, name, category }))} value={anchorId} params={params} />
      </section>

      <section className="mt-6">
        {occasion ? (
          <Suspense key={`${occasion.id}|${weather}|${anchorId}`} fallback={<CardsSkeleton />}>
            <Picks items={items} occasion={occasion} weather={weather} anchorId={anchorId} />
          </Suspense>
        ) : (
          <div className="rounded-2xl border border-dashed border-neutral-300 p-6 text-center dark:border-neutral-700">
            <p className="font-medium">Where are you going?</p>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Pick an occasion and you&apos;ll get your 3 best outfits.</p>
          </div>
        )}
      </section>
    </main>
  );
}

async function Picks({ items, occasion, weather, anchorId }: { items: Item[]; occasion: Occasion; weather: Weather; anchorId: string | null }) {
  const res = await getSuggestions({ items, occasion, weather, anchorId });
  if (res.outfits.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-orange-300 p-6 text-center dark:border-orange-900">
        <p className="font-medium">No outfits</p>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{res.emptyReason ?? "Nothing in your closet fits this. Try another combo."}</p>
      </div>
    );
  }
  return <OutfitCards outfits={res.outfits} occasionId={occasion.id} weather={weather} />;
}

function CardsSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy>
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-56 animate-pulse rounded-2xl bg-neutral-100 dark:bg-neutral-900" />
      ))}
    </div>
  );
}
