import Link from "next/link";

// Shown for a deleted item link or any wrong address.
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-5 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Not here</h1>
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">That page or item doesn&apos;t exist anymore. It may have been deleted.</p>
      <div className="mt-6 flex gap-3">
        <Link href="/closet" className="inline-flex h-11 items-center rounded-xl bg-neutral-900 px-5 text-sm font-semibold text-white dark:bg-white dark:text-neutral-900">
          Closet
        </Link>
        <Link href="/" className="inline-flex h-11 items-center rounded-xl border border-neutral-300 px-5 text-sm font-semibold dark:border-neutral-700">
          Today
        </Link>
      </div>
    </main>
  );
}
