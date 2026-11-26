import { NextResponse } from "next/server";
import { createWorn } from "@/lib/db/outfits";
import { jsonError, requireLogin } from "@/lib/session";
import { WearBody, firstIssue } from "@/lib/validation";

export async function POST(req: Request) {
  const denied = await requireLogin();
  if (denied) return denied;
  const parsed = WearBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(firstIssue(parsed.error), 400);
  try {
    return NextResponse.json({ outfit: await createWorn(parsed.data) }, { status: 201 });
  } catch (e) {
    return jsonError((e as Error).message, 500);
  }
}
