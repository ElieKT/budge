/**
 * Client-only helper: resizes/re-encodes an arbitrary image file into a
 * small square JPEG before it's ever uploaded. Phone-camera photos are
 * routinely 2-8MB, which used to blow past both our own size cap and
 * Next.js's default Server Action body limit — resizing client-side means
 * uploads work reliably regardless of the original photo's size, instead
 * of just raising limits and hoping.
 */
export async function resizeImageToSquareJpeg(file: File, maxDimension = 512, quality = 0.85): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(maxDimension, Math.max(bitmap.width, bitmap.height));

  const canvas = document.createElement("canvas");
  canvas.width = side;
  canvas.height = side;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported in this browser.");

  // Center-crop to a square so the avatar isn't stretched or letterboxed.
  const cropSize = Math.min(bitmap.width, bitmap.height);
  const sx = (bitmap.width - cropSize) / 2;
  const sy = (bitmap.height - cropSize) / 2;
  ctx.drawImage(bitmap, sx, sy, cropSize, cropSize, 0, 0, side, side);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Failed to encode image."))),
      "image/jpeg",
      quality,
    );
  });
}
