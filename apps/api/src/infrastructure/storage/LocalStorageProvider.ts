import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import type { StorageProvider, StoredFile } from "../../domain/ports/providers";
import { env } from "../../config/env";

/**
 * Dev/self-hosted default: writes to disk under UPLOAD_DIR and serves via a
 * static route the app mounts at /uploads. Randomized keys (never the
 * original filename or a guessable id) so URLs can't be enumerated.
 */
export class LocalStorageProvider implements StorageProvider {
  async saveBuffer(buffer: Buffer, options: { keyPrefix: string; contentType: string }): Promise<StoredFile> {
    const ext = options.contentType === "image/webp" ? "webp" : "bin";
    const key = `${options.keyPrefix}/${crypto.randomUUID()}.${ext}`;
    const fullPath = path.join(env.UPLOAD_DIR, key);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, buffer);
    return { key, url: `${env.API_BASE_URL}/uploads/${key}` };
  }
}
