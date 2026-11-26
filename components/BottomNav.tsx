"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Camera, History, Plus, Shirt, Sparkles } from "lucide-react";

// Tabs grow as phases land (Settings comes in Phase 5).
const TABS = [
  { href: "/", label: "Today", icon: Sparkles, match: (p: string) => p === "/" },
  { href: "/closet", label: "Closet", icon: Shirt, match: (p: string) => p.startsWith("/closet") },
  { href: "/add", label: "Add", icon: Plus, match: (p: string) => p === "/add" },
  { href: "/rate", label: "Rate", icon: Camera, match: (p: string) => p.startsWith("/rate") },
  { href: "/history", label: "History", icon: History, match: (p: string) => p.startsWith("/history") },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-neutral-200 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/90"
    >
      <ul className="mx-auto flex max-w-2xl">
        {TABS.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex h-16 flex-col items-center justify-center gap-1 text-xs font-medium ${
                  active ? "text-neutral-900 dark:text-white" : "text-neutral-400 dark:text-neutral-500"
                }`}
              >
                <Icon className="size-6" strokeWidth={active ? 2.25 : 1.75} aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
