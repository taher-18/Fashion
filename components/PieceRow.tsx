import Link from "next/link";
import ItemThumb from "@/components/ItemThumb";
import type { Color } from "@/lib/types";

export type Piece = { id: string; name: string; subtype: string; color: Color; photoUrl: string | null };

/** Small thumbnails of an outfit's pieces, each linking to the item. */
export default function PieceRow({ pieces }: { pieces: Piece[] }) {
  return (
    <ul className="grid grid-cols-5 gap-2">
      {pieces.map((p) => (
        <li key={p.id}>
          <Link href={`/closet/${p.id}`} className="block">
            <div className="relative aspect-square overflow-hidden rounded-xl bg-neutral-100 ring-1 ring-black/5 dark:bg-neutral-900 dark:ring-white/20">
              <ItemThumb url={p.photoUrl} color={p.color} subtype={p.subtype} alt={p.name} sizes="20vw" label={false} />
            </div>
            <p className="mt-1 line-clamp-2 text-[11px] leading-tight text-neutral-600 dark:text-neutral-400">{p.name}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
