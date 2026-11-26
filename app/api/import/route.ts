import { NextResponse } from "next/server";
import { importAll } from "@/lib/db/backup";
import { jsonError, requireLogin } from "@/lib/session";
import { ImportFile, firstIssue } from "@/lib/validation";

// Merges a JSON backup (this app's export, or the seed format) into the closet. Never deletes anything.
export async function POST(req: Request) {
  const denied = await requireLogin();
  if (denied) return denied;
  const parsed = ImportFile.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError(`That file doesn't look like a closet backup (${firstIssue(parsed.error)})`, 400);
  if (!parsed.data.items?.length && !parsed.data.occasions?.length && !parsed.data.outfits_worn?.length) {
    return jsonError("That file has nothing to import", 400);
  }
  try {
    return NextResponse.json({ counts: await importAll(parsed.data) });
  } catch (e) {
    return jsonError((e as Error).message, 500);
  }
}
