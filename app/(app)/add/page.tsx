import { connection } from "next/server";
import ItemForm from "@/components/ItemForm";
import { aiStatus } from "@/lib/ai/client";

export default async function AddPage() {
  await connection(); // read the AI env at request time, not build time
  return (
    <main className="px-4 pt-[max(1rem,env(safe-area-inset-top))]">
      <h1 className="text-2xl font-semibold tracking-tight">Add item</h1>
      <p className="mb-5 mt-1 text-sm text-neutral-500 dark:text-neutral-400">Snap it, auto-tag or fill in the basics, save.</p>
      <ItemForm ai={aiStatus()} />
    </main>
  );
}
