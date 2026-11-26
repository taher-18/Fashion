import Image from "next/image";
import { COLOR_INFO } from "@/lib/engine/colors";
import { pretty } from "@/lib/format";
import type { Color } from "@/lib/types";

/** Square photo, or a color block with the item type when there's no photo yet. */
export default function ItemThumb({
  url,
  color,
  subtype,
  alt,
  sizes = "50vw",
  priority = false,
  label = true,
}: {
  url: string | null;
  color: Color;
  subtype: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
  /** Show the item type on the color block (hide it on tiny thumbnails). */
  label?: boolean;
}) {
  if (url) {
    return (
      <Image src={url} alt={alt} fill unoptimized priority={priority} sizes={sizes} className="object-cover" />
    );
  }
  const info = COLOR_INFO[color];
  const dark = info.lightness < 55;
  return (
    <div
      className="flex h-full w-full items-end p-3"
      style={
        color === "other"
          ? { background: "linear-gradient(135deg, #fda4af, #fcd34d, #6ee7b7, #93c5fd)" }
          : { backgroundColor: info.hex }
      }
    >
      {label && <span className={`text-sm font-medium ${dark ? "text-white/85" : "text-black/60"}`}>{pretty(subtype)}</span>}
    </div>
  );
}
