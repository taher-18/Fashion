export default function Loading() {
  return (
    <div className="px-4 pt-[max(1rem,env(safe-area-inset-top))]" aria-busy>
      <div className="h-8 w-28 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-800" />
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="aspect-square animate-pulse rounded-2xl bg-neutral-200 dark:bg-neutral-800" />
        ))}
      </div>
    </div>
  );
}
