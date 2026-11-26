import { NextResponse } from "next/server";
import { AiError, aiStatus } from "@/lib/ai/client";
import { tagItem } from "@/lib/ai/features";
import { jsonError, requireLogin } from "@/lib/session";
import { readJpeg } from "@/lib/upload";

export const maxDuration = 60;

// Multipart "file" (JPEG of one clothing item) -> suggested tags for the Add form.
export async function POST(req: Request) {
  const denied = await requireLogin();
  if (denied) return denied;
  const status = aiStatus();
  if (!status.enabled) return NextResponse.json({ error: `AI is off. ${status.reason}`, ai_off: true }, { status: 503 });

  const photo = await readJpeg(await req.formData().catch(() => null));
  if ("error" in photo) return jsonError(photo.error, photo.status);
  try {
    return NextResponse.json({ tag: await tagItem(photo.bytes) });
  } catch (e) {
    if (e instanceof AiError) return jsonError(e.message, e.status);
    return jsonError("Auto-tag failed. Fill it in by hand.", 500);
  }
}
