import { notFound } from "next/navigation";
import ItemDetail from "@/components/ItemDetail";
import { getItem, getWearStats } from "@/lib/db/items";
import { signPhotoUrls } from "@/lib/db/storage";
import { Uuid } from "@/lib/validation";

export default async function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!Uuid.safeParse(id).success) notFound();

  const [item, stats] = await Promise.all([getItem(id), getWearStats(id)]);
  if (!item) notFound();

  const urls = await signPhotoUrls([item.photo_path]);
  const photoUrl = item.photo_path ? urls[item.photo_path] ?? null : null;

  return <ItemDetail key={item.id} item={item} photoUrl={photoUrl} stats={stats} />;
}
