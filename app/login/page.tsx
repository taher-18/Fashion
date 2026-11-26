import { Shirt } from "lucide-react";
import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-5 py-10">
      <div className="mb-8 flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
          <Shirt className="size-5" aria-hidden />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Closet</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Your fits, picked for you.</p>
        </div>
      </div>
      <LoginForm />
    </main>
  );
}
