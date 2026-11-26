import Link from "next/link";
import { Plus } from "lucide-react";
import ItemThumb from "@/components/ItemThumb";
import Swatch from "@/components/Swatch";
import { dbConfigured } from "@/lib/db/client";
import { listItems } from "@/lib/db/items";
import { signPhotoUrls } from "@/lib/db/storage";
import { COLOR_INFO } from "@/lib/engine/colors";
import { CATEGORIES, CATEGORY_LABELS, COLORS, type Category, type Color, type Item } from "@/lib/types";

type Filters = { category: Category | null; color: Color | null; wash: boolean };
type SP = Promise<Record<string, string | string[] | undefined>>;

function readFilters(sp: Awaited<SP>): Filters {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const c = one(sp.category);
  const col = one(sp.color);
  return {
    category: CATEGORIES.includes(c as Category) ? (c as Category) : null,
    color: COLORS.includes(col as Color) ? (col as Color) : null,
    wash: one(sp.wash) === "1",
  };
}

/** Link to the closet with one filter changed. Tapping the active value clears it. */
function hrefWith(f: Filters, change: Partial<Filters>): string {
  const next = { ...f, ...change };
  const q = new URLSearchParams();
  if (next.category) q.set("category", next.category);
  if (next.color) q.set("color", next.color);
  if (next.wash) q.set("wash", "1");
  const s = q.toString();
  return s ? `/closet?${s}` : "/closet";
}

const chip =
  "inline-flex h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-medium whitespace-nowrap";
const chipOn = "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900";
const chipOff = "border-neutral-200 text-neutral-700 dark:border-neutral-800 dark:text-neutral-300";

export default async function ClosetPage({ searchParams }: { searchParams: SP }) {
  const f = readFilters(await searchParams);

  if (!dbConfigured()) {
    return <p className="p-5 text-sm text-neutral-500">Supabase isn&apos;t set up yet. Add the keys to .env.local.</p>;
  }

  const all = await listItems();
  const items = all.filter(
    (i) => (!f.category || i.category === f.category) && (!f.color || i.color === f.color) && (!f.wash || i.in_wash),
  );
  const urls = await signPhotoUrls(items.map((i) => i.photo_path));
  const colorsOwned = COLORS.filter((c) => all.some((i) => i.color === c));
  const washCount = all.filter((i) => i.in_wash).length;
  const filtering = Boolean(f.category || f.color || f.wash);

  const groups = CATEGORIES.map((cat) => ({ cat, items: items.filter((i) => i.category === cat) })).filter(
    (g) => g.items.length > 0,
  );

  return (
    <main>
      <header className="sticky top-0 z-10 bg-white/90 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-3 backdrop-blur dark:bg-neutral-950/90">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Closet</h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {filtering ? `${items.length} of ${all.length} items` : `${all.length} items`}
            </p>
          </div>
          <Link
            href="/add"
            className="inline-flex h-11 items-center gap-1.5 rounded-full bg-neutral-900 px-4 text-sm font-semibold text-white dark:bg-white dark:text-neutral-900"
          >
            <Plus className="size-4" aria-hidden /> Add
          </Link>
        </div>

        {/* Category chips */}
        <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none]">
          <Link href={hrefWith(f, { category: null })} className={`${chip} ${!f.category ? chipOn : chipOff}`}>
            All
          </Link>
          {CATEGORIES.map((cat) => (
            <Link
              key={cat}
              href={hrefWith(f, { category: f.category === cat ? null : cat })}
              className={`${chip} ${f.category === cat ? chipOn : chipOff}`}
            >
              {CATEGORY_LABELS[cat]}
            </Link>
          ))}
        </div>

        {/* Color + In wash chips */}
        <div className="-mx-4 mt-2 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none]">
          <Link
            href={hrefWith(f, { wash: !f.wash })}
            className={`${chip} ${f.wash ? chipOn : chipOff}`}
            aria-pressed={f.wash}
          >
            In wash{washCount > 0 ? ` · ${washCount}` : ""}
          </Link>
          {colorsOwned.map((c) => (
            <Link
              key={c}
              href={hrefWith(f, { color: f.color === c ? null : c })}
              aria-label={COLOR_INFO[c].label}
              aria-pressed={f.color === c}
              className={`${chip} px-3 ${f.color === c ? chipOn : chipOff}`}
            >
              <Swatch color={c} />
              {f.color === c && COLOR_INFO[c].label}
            </Link>
          ))}
        </div>
      </header>

      {groups.length === 0 ? (
        <div className="px-5 py-16 text-center">
          <p className="font-medium">{filtering ? "Nothing matches" : "No clothes yet"}</p>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            {filtering ? (
              <Link href="/closet" className="underline">
                Clear filters
              </Link>
            ) : (
              "Tap Add to save your first piece."
            )}
          </p>
        </div>
      ) : (
        groups.map((g) => (
          <section key={g.cat} className="px-4 pt-4">
            <h2 className="mb-2 text-sm font-semibold text-neutral-500 dark:text-neutral-400">
              {CATEGORY_LABELS[g.cat]} · {g.items.length}
            </h2>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {g.items.map((item, idx) => (
                <ItemTile key={item.id} item={item} url={item.photo_path ? urls[item.photo_path] ?? null : null} priority={idx < 4} />
              ))}
            </ul>
          </section>
        ))
      )}
    </main>
  );
}

function ItemTile({ item, url, priority }: { item: Item; url: string | null; priority: boolean }) {
  return (
    <li>
      <Link href={`/closet/${item.id}`} className="block">
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-neutral-100 ring-1 ring-black/5 dark:bg-neutral-900 dark:ring-white/20">
          <ItemThumb url={url} color={item.color} subtype={item.subtype} alt={item.name} sizes="(max-width: 640px) 50vw, 33vw" priority={priority} />
          <div className="absolute left-2 top-2 flex flex-wrap gap-1">
            {item.in_wash && (
              <span className="rounded-full bg-sky-600 px-2 py-0.5 text-xs font-semibold text-white">In wash</span>
            )}
            {item.needs_confirm && (
              <span className="rounded-full bg-amber-400 px-2 py-0.5 text-xs font-semibold text-black">Confirm?</span>
            )}
          </div>
        </div>
        <p className="mt-1.5 line-clamp-2 text-sm font-medium leading-snug">{item.name}</p>
        {item.brand && <p className="text-xs text-neutral-500 dark:text-neutral-400">{item.brand}</p>}
      </Link>
    </li>
  );
}
