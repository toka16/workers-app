import { MAX_IMAGE_BYTES } from "@/domain/models";

export { MAX_IMAGE_BYTES };
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
/** Largest file we accept from the device. Anything up to this is shrunk in the browser to fit MAX_IMAGE_BYTES. */
export const MAX_SOURCE_BYTES = 25 * 1024 * 1024;

export interface ProcessedImage {
  blob: Blob;
  contentType: string;
  extension: string;
}

/** The image couldn't be shrunk below the byte limit. */
export class ImageTooLargeError extends Error {
  constructor() {
    super("image_too_large");
    this.name = "ImageTooLargeError";
  }
}

const MIN_QUALITY = 0.6;
const MAX_ATTEMPTS = 6;

/**
 * Downscales and re-encodes an image in the browser before upload. Keeps storage and bandwidth
 * small (and Supabase image transformations, a paid feature, unnecessary).
 * `square` crops to the centre, used for avatars.
 * If the result is still over `maxBytes`, quality is lowered first (barely visible at these sizes),
 * then the dimensions; throws ImageTooLargeError when even that isn't enough.
 */
export async function processImage(
  file: File,
  maxSize: number,
  { square = false, quality = 0.82, maxBytes = MAX_IMAGE_BYTES } = {},
): Promise<ProcessedImage> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    const side = Math.min(bitmap.width, bitmap.height);
    const source = square
      ? { sx: (bitmap.width - side) / 2, sy: (bitmap.height - side) / 2, sw: side, sh: side }
      : { sx: 0, sy: 0, sw: bitmap.width, sh: bitmap.height };
    let longest = Math.min(maxSize, Math.max(source.sw, source.sh));

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const image = await encode(bitmap, source, longest, quality);
      if (image.blob.size <= maxBytes) return image;
      if (quality > MIN_QUALITY) quality = Math.max(MIN_QUALITY, quality - 0.1);
      else longest = Math.round(longest * 0.75);
    }
    throw new ImageTooLargeError();
  } finally {
    bitmap.close();
  }
}

async function encode(
  bitmap: ImageBitmap,
  source: { sx: number; sy: number; sw: number; sh: number },
  longest: number,
  quality: number,
): Promise<ProcessedImage> {
  const scale = Math.min(1, longest / Math.max(source.sw, source.sh));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(source.sw * scale);
  canvas.height = Math.round(source.sh * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, source.sx, source.sy, source.sw, source.sh, 0, 0, canvas.width, canvas.height);

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

/** "2 MB", "480 KB". Plain unit symbols: Intl's Georgian units are inconsistent (MB vs. კბაიტი). */
export function formatBytes(bytes: number, locale: string): string {
  const mb = bytes >= 1024 * 1024;
  const value = mb ? bytes / (1024 * 1024) : Math.max(1, bytes / 1024);
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: mb ? 1 : 0 }).format(value)} ${mb ? "MB" : "KB"}`;
}
