import multer from "multer";
import { env } from "../../../config/env";

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

/** Multer memory storage: buffer is optimized (resized/re-encoded) before ever touching disk, so no unvalidated file lands in the filesystem. */
export const photoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_UPLOAD_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(new Error("UNSUPPORTED_FILE_TYPE"));
      return;
    }
    cb(null, true);
  },
});

const MAGIC_BYTES: Array<{ mime: string; bytes: number[] }> = [
  { mime: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  { mime: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47] },
  { mime: "image/webp", bytes: [0x52, 0x49, 0x46, 0x46] }, // "RIFF" (WebP container)
];

/** Belt-and-suspenders check: multer trusts the client-declared MIME type, so we also sniff the real file signature before it reaches the image optimizer. */
export function hasValidImageSignature(buffer: Buffer): boolean {
  return MAGIC_BYTES.some(({ bytes }) => bytes.every((b, i) => buffer[i] === b));
}
