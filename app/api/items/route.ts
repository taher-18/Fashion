import { NextResponse } from "next/server";
import { createItem, listItems } from "@/lib/db/items";
import { jsonError, requireLogin } from "@/lib/session";
import { ItemCreate, firstIssue } from "@/lib/validation";

export async function GET() {
  const denied = await requireLogin();
  if (denied) return denied;
  try {
    return NextResponse.json({ items: await listItems() });
  } catch (e) {
    return jsonError((e as Error).message, 500);
  }
}

export async function POST(req: Request) {
  const denied = await requireLogin();
  if (denied) return denied;
  const parsed = ItemCreate.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(firstIssue(parsed.error), 400);
  try {
    return NextResponse.json({ item: await createItem(parsed.data) }, { status: 201 });
  } catch (e) {
    return jsonError((e as Error).message, 500);
  }
}
