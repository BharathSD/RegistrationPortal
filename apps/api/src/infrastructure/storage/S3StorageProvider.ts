import crypto from "node:crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { StorageProvider, StoredFile } from "../../domain/ports/providers";
import { env } from "../../config/env";

/**
 * Adapter for any S3-compatible bucket — AWS S3, MinIO, Cloudflare R2,
 * Backblaze B2. Same code path for all of them; only the env vars
 * (S3_ENDPOINT, S3_FORCE_PATH_STYLE, credentials) change between providers,
 * which is the point of standardizing on the S3 API in the first place —
 * moving from MinIO to R2 later is a config change, not a code change.
 */
export class S3StorageProvider implements StorageProvider {
  private readonly client: S3Client;

  constructor() {
    if (!env.S3_BUCKET || !env.S3_REGION || !env.S3_ACCESS_KEY_ID || !env.S3_SECRET_ACCESS_KEY) {
      throw new Error("S3 storage is not configured (S3_BUCKET/S3_REGION/S3_ACCESS_KEY_ID/S3_SECRET_ACCESS_KEY)");
    }
    this.client = new S3Client({
      region: env.S3_REGION,
      endpoint: env.S3_ENDPOINT,
      forcePathStyle: env.S3_FORCE_PATH_STYLE,
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY_ID,
        secretAccessKey: env.S3_SECRET_ACCESS_KEY,
      },
    });
  }

  async saveBuffer(buffer: Buffer, options: { keyPrefix: string; contentType: string }): Promise<StoredFile> {
    const ext = options.contentType === "image/webp" ? "webp" : "bin";
    const key = `${options.keyPrefix}/${crypto.randomUUID()}.${ext}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: env.S3_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: options.contentType,
      }),
    );

    return { key, url: this.publicUrl(key) };
  }

  /**
   * Bucket is public-read (see docs/DEPLOYMENT.md / infra bucket policy) —
   * same "public profile-photo URL" contract LocalStorageProvider already
   * has, just backed by a real bucket instead of disk. Short-lived signed
   * URLs are a separate follow-up (would need photoUrl stored as a bare key
   * and re-signed on every read, not persisted as a URL).
   */
  private publicUrl(key: string): string {
    if (env.S3_PUBLIC_URL_BASE) return `${env.S3_PUBLIC_URL_BASE.replace(/\/$/, "")}/${key}`;
    if (env.S3_ENDPOINT) {
      // Path-style: http://endpoint/bucket/key — correct for MinIO and how
      // this adapter is configured with S3_FORCE_PATH_STYLE.
      return `${env.S3_ENDPOINT.replace(/\/$/, "")}/${env.S3_BUCKET}/${key}`;
    }
    // Real AWS S3, virtual-hosted-style.
    return `https://${env.S3_BUCKET}.s3.${env.S3_REGION}.amazonaws.com/${key}`;
  }
}
