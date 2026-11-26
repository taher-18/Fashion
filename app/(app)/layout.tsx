import { redirect } from "next/navigation";
import BottomNav from "@/components/BottomNav";
import { isLoggedIn } from "@/lib/session";

// Shell for every logged-in screen: content + bottom tab bar.
// proxy.ts already guards these routes; checking again here means a future proxy
// mistake can never expose the closet.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  if (!(await isLoggedIn())) redirect("/login");
  return (
    <>
      <div className="mx-auto w-full max-w-2xl pb-[calc(5.5rem+env(safe-area-inset-bottom))]">{children}</div>
      <BottomNav />
    </>
  );
}
