import { COLOR_INFO } from "@/lib/engine/colors";
import type { Color } from "@/lib/types";

/** Round color dot. "other" shows a multicolor dot. */
export default function Swatch({ color, className = "size-5" }: { color: Color; className?: string }) {
  const style =
    color === "other"
      ? { background: "conic-gradient(#e11d48, #f59e0b, #10b981, #3b82f6, #a855f7, #e11d48)" }
      : { backgroundColor: COLOR_INFO[color].hex };
  return (
    <span
      aria-hidden
      className={`inline-block shrink-0 rounded-full ring-1 ring-black/15 ring-inset dark:ring-white/20 ${className}`}
      style={style}
    />
  );
}
