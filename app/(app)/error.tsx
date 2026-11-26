"use client";

export default function ErrorScreen({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="px-5 pt-[max(2.5rem,env(safe-area-inset-top))]">
      <h1 className="text-xl font-semibold">Something broke</h1>
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">{error.message || "Unknown error"}</p>
      <button
        onClick={reset}
        className="mt-5 h-11 rounded-xl bg-neutral-900 px-5 text-sm font-semibold text-white dark:bg-white dark:text-neutral-900"
      >
        Try again
      </button>
    </main>
  );
}
