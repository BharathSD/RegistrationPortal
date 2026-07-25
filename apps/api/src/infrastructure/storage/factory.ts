import type { StorageProvider } from "../../domain/ports/providers";
import { env } from "../../config/env";
import { LocalStorageProvider } from "./LocalStorageProvider";
import { S3StorageProvider } from "./S3StorageProvider";

export function createStorageProvider(): StorageProvider {
  return env.STORAGE_DRIVER === "s3" ? new S3StorageProvider() : new LocalStorageProvider();
}
