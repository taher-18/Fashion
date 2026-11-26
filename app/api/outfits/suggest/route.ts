import { NextResponse } from "next/server";
import { listItems } from "@/lib/db/items";
import { listOccasions } from "@/lib/db/occasions";
import { jsonError, requireLogin } from "@/lib/session";
import { getSuggestions } from "@/lib/suggestions";
import { SuggestBody, firstIssue } from "@/lib/validation";

export async function POST(req: Request) {
  const denied = await requireLogin();
  if (denied) return denied;
  const parsed = SuggestBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(firstIssue(parsed.error), 400);
  const { occasion_id, weather, anchor_id, limit } = parsed.data;
  try {
    const [items, occasions] = await Promise.all([listItems(), listOccasions()]);
    const occasion = occasions.find((o) => o.id === occasion_id);
    if (!occasion) return jsonError("Unknown occasion", 404);
    return NextResponse.json(await getSuggestions({ items, occasion, weather, anchorId: anchor_id, limit }));
  } catch (e) {
    return jsonError((e as Error).message, 500);
  }
}
