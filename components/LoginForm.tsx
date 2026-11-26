"use client";

import { useState, type FormEvent } from "react";

export default function LoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        window.location.replace("/");
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "Something went wrong");
    } catch {
      setError("Can't reach the server");
    }
    setBusy(false);
  }

  return (
    <form onSubmit={onSubmit} method="post" action="/api/login" className="flex flex-col gap-3">
      <label htmlFor="password" className="text-sm font-medium">
        Password
      </label>
      <input
        id="password"
        type="password"
        autoComplete="current-password"
        autoFocus
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="h-12 rounded-xl border border-neutral-300 bg-white px-4 text-base outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:focus:border-neutral-300"
      />
      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={busy || password.length === 0}
        className="mt-2 h-12 rounded-xl bg-neutral-900 text-base font-semibold text-white disabled:opacity-40 dark:bg-white dark:text-neutral-900"
      >
        {busy ? "Checking…" : "Enter"}
      </button>
    </form>
  );
}
