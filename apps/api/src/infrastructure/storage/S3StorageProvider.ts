import crypto from "node:crypto";
import type { StorageProvider, StoredFile } from "../../domain/ports/providers";
import { env } from "../../config/env";

/**
 * Production adapter skeleton for an S3-compatible bucket (AWS S3, R2,
 * MinIO). Intentionally uses the plain REST PutObject call (SigV4) rather
 * than pulling in the full AWS SDK, to keep this adapter's footprint small;
 * swap in `@aws-sdk/client-s3` here if the team prefers the official SDK.
 * Left unimplemented beyond the interface contract — wire up real signing
 * before setting STORAGE_DRIVER=s3 in production.
 */
export class S3StorageProvider implements StorageProvider {
  async saveBuffer(_buffer: Buffer, options: { keyPrefix: string; contentType: string }): Promise<StoredFile> {
    if (!env.S3_BUCKET || !env.S3_REGION || !env.S3_ACCESS_KEY_ID || !env.S3_SECRET_ACCESS_KEY) {
      throw new Error("S3 storage is not configured (S3_BUCKET/S3_REGION/S3_ACCESS_KEY_ID/S3_SECRET_ACCESS_KEY)");
    }
    const key = `${options.keyPrefix}/${crypto.randomUUID()}.webp`;
    throw new Error(
      `S3StorageProvider.saveBuffer is a wiring stub — implement SigV4 PutObject (or use @aws-sdk/client-s3) for key "${key}" before enabling STORAGE_DRIVER=s3`,
    );
  }
}
