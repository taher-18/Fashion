import { NextResponse } from "next/server";
import { deleteItem, getItem, getWearStats, updateItem } from "@/lib/db/items";
import { jsonError, requireLogin } from "@/lib/session";
import { ItemPatch, Uuid, firstIssue } from "@/lib/validation";

type Ctx = { params: Promise<{ id: string }> };

async function readId(ctx: Ctx): Promise<string | null> {
  const { id } = await ctx.params;
  return Uuid.safeParse(id).success ? id : null;
}

export async function GET(_req: Request, ctx: Ctx) {
  const denied = await requireLogin();
  if (denied) return denied;
  const id = await readId(ctx);
  if (!id) return jsonError("Item not found", 404);
  try {
    const item = await getItem(id);
    if (!item) return jsonError("Item not found", 404);
    return NextResponse.json({ item, stats: await getWearStats(id) });
  } catch (e) {
    return jsonError((e as Error).message, 500);
  }
}

export async function PATCH(req: Request, ctx: Ctx) {
  const denied = await requireLogin();
  if (denied) return denied;
  const id = await readId(ctx);
  if (!id) return jsonError("Item not found", 404);
  const parsed = ItemPatch.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(firstIssue(parsed.error), 400);
  if (Object.keys(parsed.data).length === 0) return jsonError("Nothing to change", 400);
  try {
    const item = await updateItem(id, parsed.data);
    if (!item) return jsonError("Item not found", 404);
    return NextResponse.json({ item });
  } catch (e) {
    return jsonError((e as Error).message, 500);
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const denied = await requireLogin();
  if (denied) return denied;
  const id = await readId(ctx);
  if (!id) return jsonError("Item not found", 404);
  try {
    if (!(await deleteItem(id))) return jsonError("Item not found", 404);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return jsonError((e as Error).message, 500);
  }
}
