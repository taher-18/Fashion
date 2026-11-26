import { randomUUID } from "node:crypto";
import { getDb } from "./client";

const BUCKET = "clothes";
const SIGNED_URL_TTL_S = 60 * 60; // 1 hour

export async function uploadItemPhoto(bytes: ArrayBuffer): Promise<string> {
  return uploadJpeg(`items/${randomUUID()}.jpg`, bytes);
}

/** Mirror selfies for Rate my fit live under selfies/ in the same private bucket. */
export async function uploadSelfie(bytes: ArrayBuffer): Promise<string> {
  return uploadJpeg(`selfies/${randomUUID()}.jpg`, bytes);
}

async function uploadJpeg(path: string, bytes: ArrayBuffer): Promise<string> {
  const { error } = await getDb()
    .storage.from(BUCKET)
    .upload(path, bytes, { contentType: "image/jpeg", upsert: false });
  if (error) throw new Error(`Photo upload failed: ${error.message}`);
  return path;
}

export async function removePhotos(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  const { error } = await getDb().storage.from(BUCKET).remove(paths);
  if (error) console.error("Photo cleanup failed:", error.message);
}

/** Map of photo_path -> short-lived signed URL (the bucket is private). */
export async function signPhotoUrls(paths: (string | null)[]): Promise<Record<string, string>> {
  const unique = [...new Set(paths.filter((p): p is string => Boolean(p)))];
  if (unique.length === 0) return {};
  const { data, error } = await getDb().storage.from(BUCKET).createSignedUrls(unique, SIGNED_URL_TTL_S);
  if (error) throw new Error(`Couldn't load photos: ${error.message}`);
  const out: Record<string, string> = {};
  for (const row of data) {
    if (row.path && row.signedUrl) out[row.path] = row.signedUrl;
  }
  return out;
}
