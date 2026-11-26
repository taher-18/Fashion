"use client";

import Link from "next/link";

// In production Next hides the real error text, so explain the likely causes instead.
export default function ErrorScreen({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const dev = process.env.NODE_ENV !== "production";
  return (
    <main className="px-5 pt-[max(2.5rem,env(safe-area-inset-top))]">
      <h1 className="text-xl font-semibold">Couldn&apos;t load this</h1>
      <p className="mt-2 max-w-prose text-sm text-neutral-500 dark:text-neutral-400">
        Usually the database is waking up or unreachable. If it keeps happening: open the Supabase dashboard. Free
        projects pause after about a week of no use, and <b>Restore</b> brings it back with your data intact.
      </p>
      {dev && error.message && <p className="mt-3 rounded-xl bg-neutral-100 p-3 font-mono text-xs dark:bg-neutral-900">{error.message}</p>}
      {error.digest && <p className="mt-2 text-xs text-neutral-400">Error code: {error.digest}</p>}
      <div className="mt-5 flex gap-3">
        <button onClick={reset} className="h-11 rounded-xl bg-neutral-900 px-5 text-sm font-semibold text-white dark:bg-white dark:text-neutral-900">
          Try again
        </button>
        <Link href="/" className="inline-flex h-11 items-center rounded-xl border border-neutral-300 px-5 text-sm font-semibold dark:border-neutral-700">
          Go to Today
        </Link>
      </div>
    </main>
  );
}
