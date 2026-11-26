// Browser-only: shrink a photo to max 1280px on the long side and re-encode as JPEG
// before upload, so Storage stays small and iPhone HEIC/PNG photos become JPEG.

export async function resizeToJpeg(file: File, maxSide = 1280, quality = 0.82): Promise<Blob> {
  let source: ImageBitmap | HTMLImageElement;
  let w: number;
  let h: number;
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
    source = bmp;
    w = bmp.width;
    h = bmp.height;
  } catch {
    const img = await loadImage(file);
    source = img;
    w = img.naturalWidth;
    h = img.naturalHeight;
  }
  if (!w || !h) throw new Error("Couldn't read that photo");

  const scale = Math.min(1, maxSide / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Couldn't process that photo");
  ctx.fillStyle = "#ffffff"; // transparent PNGs would turn black in JPEG
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  if ("close" in source) source.close();

  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", quality));
  if (!blob) throw new Error("Couldn't process that photo");
  return blob;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That file isn't a photo this browser can open"));
    };
    img.src = url;
  });
}
