import { NextResponse } from "next/server";
import { AiError, aiStatus } from "@/lib/ai/client";
import { rateFit } from "@/lib/ai/features";
import { saveFitCheck } from "@/lib/db/fitChecks";
import { listItems } from "@/lib/db/items";
import { listOccasions } from "@/lib/db/occasions";
import { removePhotos, signPhotoUrls, uploadSelfie } from "@/lib/db/storage";
import { jsonError, requireLogin } from "@/lib/session";
import { readJpeg } from "@/lib/upload";

export const maxDuration = 60;

// Multipart "file" (mirror selfie JPEG) + "occasion_id" -> score, verdict, fixes and swaps from the closet.
export async function POST(req: Request) {
  const denied = await requireLogin();
  if (denied) return denied;
  const status = await aiStatus();
  if (!status.enabled) return NextResponse.json({ error: `AI is off. ${status.reason}`, ai_off: true }, { status: 503 });

  const form = await req.formData().catch(() => null);
  const photo = await readJpeg(form);
  if ("error" in photo) return jsonError(photo.error, photo.status);
  const occasionId = form?.get("occasion_id");
  if (typeof occasionId !== "string" || !occasionId) return jsonError("Pick where you're going", 400);

  try {
    const [occasions, items] = await Promise.all([listOccasions(), listItems()]);
    const occasion = occasions.find((o) => o.id === occasionId);
    if (!occasion) return jsonError("Unknown occasion", 404);

    const result = await rateFit(photo.bytes, occasion, items);

    // Save the selfie + verdict (fit_checks) only once the AI answered.
    const photoPath = await uploadSelfie(photo.bytes);
    try {
      await saveFitCheck({ photo_path: photoPath, occasion_id: occasion.id, ai_result: result });
    } catch (e) {
      await removePhotos([photoPath]);
      throw e;
    }

    const byId = new Map(items.map((i) => [i.id, i]));
    const urls = await signPhotoUrls(result.swaps.map((s) => byId.get(s.item_id)?.photo_path ?? null));
    const swaps = result.swaps.flatMap((s) => {
      const it = byId.get(s.item_id);
      if (!it) return [];
      return [{ ...s, name: it.name, color: it.color, subtype: it.subtype, photoUrl: it.photo_path ? urls[it.photo_path] ?? null : null }];
    });
    return NextResponse.json({ result: { ...result, swaps } });
  } catch (e) {
    if (e instanceof AiError) return jsonError(e.message, e.status);
    return jsonError((e as Error).message || "Rating failed. Try again.", 500);
  }
}
