import Link from "next/link";
import { connection } from "next/server";
import { cookies } from "next/headers";
import { ChevronLeft } from "lucide-react";
import AiSwitch from "@/components/settings/AiSwitch";
import BackupPanel from "@/components/settings/BackupPanel";
import OccasionsEditor from "@/components/settings/OccasionsEditor";
import { AI_COOKIE, aiConfigured } from "@/lib/ai/client";
import { dbConfigured } from "@/lib/db/client";
import { listOccasions } from "@/lib/db/occasions";

export default async function SettingsPage() {
  await connection();
  const configured = aiConfigured();
  const switchedOff = (await cookies()).get(AI_COOKIE)?.value === "off";
  const occasions = dbConfigured() ? await listOccasions() : [];

  return (
    <main className="px-4 pt-[max(0.5rem,env(safe-area-inset-top))]">
      <Link href="/" className="-ml-2 inline-flex h-11 items-center gap-1 px-2 text-sm font-medium text-neutral-500 dark:text-neutral-400">
        <ChevronLeft className="size-5" aria-hidden /> Today
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold text-neutral-500 dark:text-neutral-400">AI</h2>
        <AiSwitch
          configured={configured.enabled}
          reason={configured.enabled ? null : configured.reason}
          model={configured.enabled ? (process.env.ANTHROPIC_MODEL ?? null) : null}
          on={!switchedOff}
        />
      </section>

      <section className="mt-8">
        <h2 className="mb-1 text-sm font-semibold text-neutral-500 dark:text-neutral-400">Occasions</h2>
        <p className="mb-3 text-sm text-neutral-500 dark:text-neutral-400">The chips on Today and Rate. Formality runs from 1 (lounge) to 5 (formal).</p>
        <OccasionsEditor occasions={occasions} />
      </section>

      <section className="mt-8">
        <h2 className="mb-2 text-sm font-semibold text-neutral-500 dark:text-neutral-400">Backup</h2>
        <BackupPanel />
      </section>
    </main>
  );
}
