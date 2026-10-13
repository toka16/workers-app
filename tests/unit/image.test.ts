import { afterEach, describe, expect, it, vi } from "vitest";
import { ImageTooLargeError, processImage } from "@/lib/image";

/**
 * Fake browser image APIs: the encoded size grows with pixel count and quality, so the test can
 * check how processImage shrinks an image that doesn't fit the byte limit.
 */
function fakeBrowser(width: number, height: number, bytesPerPixel: number) {
  const encodes: { width: number; height: number; quality: number }[] = [];
  vi.stubGlobal("createImageBitmap", async () => ({ width, height, close() {} }));
  vi.stubGlobal("document", {
    createElement: () => {
      const canvas = {
        width: 0,
        height: 0,
        getContext: () => ({ drawImage() {} }),
        toBlob: (done: (blob: Blob) => void, type: string, quality: number) => {
          encodes.push({ width: canvas.width, height: canvas.height, quality });
          done(new Blob([new Uint8Array(Math.round(canvas.width * canvas.height * bytesPerPixel * quality))], { type }));
        },
      };
      return canvas;
    },
  });
  return encodes;
}

const file = new File(["x"], "photo.jpg", { type: "image/jpeg" });

afterEach(() => vi.unstubAllGlobals());

describe("processImage", () => {
  it("resizes to the requested size and keeps quality when the result fits", async () => {
    const encodes = fakeBrowser(4000, 3000, 0.1);
    const image = await processImage(file, 1600, { maxBytes: 1_000_000 });
    expect(encodes).toEqual([{ width: 1600, height: 1200, quality: 0.82 }]);
    expect(image.blob.size).toBeLessThanOrEqual(1_000_000);
  });

  it("lowers quality first, then dimensions, until the image fits", async () => {
    const encodes = fakeBrowser(4000, 3000, 1);
    const image = await processImage(file, 1600, { maxBytes: 700_000 });
    expect(encodes.map((e) => [e.width, Math.round(e.quality * 100)])).toEqual([
      [1600, 82],
      [1600, 72],
      [1600, 62],
      [1600, 60],
      [1200, 60],
    ]);
    expect(image.blob.size).toBeLessThanOrEqual(700_000);
  });

  it("gives up when the image can't be made small enough", async () => {
    fakeBrowser(4000, 3000, 1);
    await expect(processImage(file, 1600, { maxBytes: 1_000 })).rejects.toBeInstanceOf(ImageTooLargeError);
  });
});
