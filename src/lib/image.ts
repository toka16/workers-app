export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_SOURCE_BYTES = 25 * 1024 * 1024;

export interface ProcessedImage {
  blob: Blob;
  contentType: string;
  extension: string;
}

/**
 * Downscales and re-encodes an image in the browser before upload. Keeps storage and bandwidth
 * small (and Supabase image transformations, a paid feature, unnecessary).
 * `square` crops to the centre, used for avatars.
 */
export async function processImage(file: File, maxSize: number, { square = false, quality = 0.82 } = {}): Promise<ProcessedImage> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const side = Math.min(bitmap.width, bitmap.height);
  const source = square
    ? { sx: (bitmap.width - side) / 2, sy: (bitmap.height - side) / 2, sw: side, sh: side }
    : { sx: 0, sy: 0, sw: bitmap.width, sh: bitmap.height };
  const scale = Math.min(1, maxSize / Math.max(source.sw, source.sh));
  const width = Math.round(source.sw * scale);
  const height = Math.round(source.sh * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, source.sx, source.sy, source.sw, source.sh, 0, 0, width, height);
  bitmap.close();

  // Safari can't encode WebP and silently returns PNG; fall back to JPEG there.
  const webp = await toBlob(canvas, "image/webp", quality);
  if (webp?.type === "image/webp") return { blob: webp, contentType: "image/webp", extension: "webp" };
  const jpeg = await toBlob(canvas, "image/jpeg", quality);
  if (!jpeg) throw new Error("Could not encode image");
  return { blob: jpeg, contentType: "image/jpeg", extension: "jpg" };
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}
