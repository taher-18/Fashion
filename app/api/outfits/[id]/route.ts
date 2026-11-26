import { NextResponse } from "next/server";
import { rateWorn } from "@/lib/db/outfits";
import { jsonError, requireLogin } from "@/lib/session";
import { RateBody, Uuid, firstIssue } from "@/lib/validation";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await requireLogin();
  if (denied) return denied;
  const { id } = await ctx.params;
  if (!Uuid.safeParse(id).success) return jsonError("Outfit not found", 404);
  const parsed = RateBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(firstIssue(parsed.error), 400);
  try {
    const outfit = await rateWorn(id, parsed.data.rating);
    if (!outfit) return jsonError("Outfit not found", 404);
    return NextResponse.json({ outfit });
  } catch (e) {
    return jsonError((e as Error).message, 500);
  }
}
