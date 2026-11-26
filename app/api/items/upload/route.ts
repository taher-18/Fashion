import { NextResponse } from "next/server";
import { signPhotoUrls, uploadItemPhoto } from "@/lib/db/storage";
import { jsonError, requireLogin } from "@/lib/session";
import { readJpeg } from "@/lib/upload";

// Expects multipart form data with a "file" field holding a JPEG.
export async function POST(req: Request) {
  const denied = await requireLogin();
  if (denied) return denied;
  const photo = await readJpeg(await req.formData().catch(() => null));
  if ("error" in photo) return jsonError(photo.error, photo.status);
  try {
    const path = await uploadItemPhoto(photo.bytes);
    const urls = await signPhotoUrls([path]);
    return NextResponse.json({ path, url: urls[path] ?? null }, { status: 201 });
  } catch (e) {
    return jsonError((e as Error).message, 500);
  }
}
