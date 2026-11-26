import BottomNav from "@/components/BottomNav";

// Shell for every logged-in screen: content + bottom tab bar.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="mx-auto w-full max-w-2xl pb-[calc(5.5rem+env(safe-area-inset-bottom))]">{children}</div>
      <BottomNav />
    </>
  );
}
