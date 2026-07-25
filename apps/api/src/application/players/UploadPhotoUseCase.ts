import type { PlayerRepository } from "../../domain/repositories/PlayerRepository";
import type { StorageProvider } from "../../domain/ports/providers";
import { optimizeProfilePhoto, perceptualHash } from "../../infrastructure/storage/imageOptimizer";
import type { PlayerWithMedical } from "../../domain/entities";

export interface UploadPhotoDeps {
  playerRepo: PlayerRepository;
  storageProvider: StorageProvider;
}

export function makeUploadPhotoUseCase({ playerRepo, storageProvider }: UploadPhotoDeps) {
  return async function uploadPhoto(playerId: string, rawBuffer: Buffer): Promise<PlayerWithMedical> {
    const { buffer, contentType } = await optimizeProfilePhoto(rawBuffer);
    const hash = await perceptualHash(rawBuffer);
    const stored = await storageProvider.saveBuffer(buffer, { keyPrefix: `players/${playerId}/photo`, contentType });
    return playerRepo.updatePhoto(playerId, stored.url, hash);
  };
}
