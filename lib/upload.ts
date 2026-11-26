// Reads the "file" field of a multipart request and checks it's a reasonably sized JPEG.
// The browser always resizes to a max-1280px JPEG first (lib/client/image.ts).

const MAX_BYTES = 5 * 1024 * 1024;

export async function readJpeg(form: FormData | null): Promise<{ bytes: ArrayBuffer } | { error: string; status: number }> {
  const file = form?.get("file");
  if (!(file instanceof File)) return { error: "No photo sent", status: 400 };
  if (file.size === 0) return { error: "That photo is empty", status: 400 };
  if (file.size > MAX_BYTES) return { error: "Photo is too big (max 5 MB)", status: 413 };
  const bytes = await file.arrayBuffer();
  const head = new Uint8Array(bytes, 0, 3);
  if (head[0] !== 0xff || head[1] !== 0xd8 || head[2] !== 0xff) return { error: "Photo must be a JPEG", status: 415 };
  return { bytes };
}
