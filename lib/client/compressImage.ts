// Browser-only (uses Canvas + createImageBitmap). Only ever imported from
// "use client" components. Downscaling client-side before upload keeps a
// full-resolution phone photo from blowing past the request size limit and
// keeps the Gemini call cheaper, without needing an image library.
const MAX_DIMENSION = 1280;
const JPEG_QUALITY = 0.82;

export interface CompressedImage {
  mimeType: "image/jpeg";
  data: string;
}

export async function compressImageFile(file: File): Promise<CompressedImage> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("This browser can't process images.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  const base64 = dataUrl.split(",")[1];
  if (!base64) throw new Error("Could not read the selected image.");
  return { mimeType: "image/jpeg", data: base64 };
}
