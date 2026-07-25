import sharp from "sharp";

const MAX_DIMENSION = 800;

/**
 * Re-encodes any uploaded profile photo to a size-capped WebP. This is a
 * security measure as much as a performance one: re-encoding strips
 * embedded scripts/metadata and normalizes whatever format the client sent
 * (magic-byte sniffing happens before this via the multer file filter).
 */
export async function optimizeProfilePhoto(buffer: Buffer): Promise<{ buffer: Buffer; contentType: string }> {
  const optimized = await sharp(buffer)
    .rotate() // apply EXIF orientation, then strip metadata
    .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
  return { buffer: optimized, contentType: "image/webp" };
}

/** Simple perceptual-ish hash (average hash on a tiny grayscale thumbnail) used only as a duplicate-detection signal, not for security. */
export async function perceptualHash(buffer: Buffer): Promise<string> {
  const { data } = await sharp(buffer)
    .grayscale()
    .resize(8, 8, { fit: "fill" })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const avg = data.reduce((sum, v) => sum + v, 0) / data.length;
  let hash = "";
  for (const v of data) hash += v >= avg ? "1" : "0";
  return BigInt(`0b${hash}`).toString(16);
}
