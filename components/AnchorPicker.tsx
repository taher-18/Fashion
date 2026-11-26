"use client";

import { useRouter } from "next/navigation";
import { CATEGORIES, CATEGORY_LABELS, type Category } from "@/lib/types";

type Option = { id: string; name: string; category: Category };

/** Native select (iOS wheel picker) for "Build around". Writes ?anchor= into the URL. */
export default function AnchorPicker({
  items,
  value,
  params,
}: {
  items: Option[];
  value: string | null;
  params: Record<string, string>;
}) {
  const router = useRouter();

  function onChange(id: string) {
    const q = new URLSearchParams(params);
    if (id) q.set("anchor", id);
    else q.delete("anchor");
    router.replace(`/?${q.toString()}`, { scroll: false });
  }

  return (
    <select
      aria-label="Build around"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      className="h-12 w-full rounded-xl border border-neutral-300 bg-white px-4 text-base dark:border-neutral-700 dark:bg-neutral-900"
    >
      <option value="">Anything</option>
      {CATEGORIES.map((cat) => {
        const group = items.filter((i) => i.category === cat);
        if (group.length === 0) return null;
        return (
          <optgroup key={cat} label={CATEGORY_LABELS[cat]}>
            {group.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </optgroup>
        );
      })}
    </select>
  );
}
