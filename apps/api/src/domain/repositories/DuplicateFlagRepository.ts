import type { DuplicateFlagCandidate } from "../entities";
import type { DuplicateSignal, DuplicateFlagStatus } from "@cricket-platform/shared";

export interface DuplicateFlagRepository {
  create(data: {
    playerId: string;
    suspectedDuplicatePlayerId: string;
    signal: DuplicateSignal;
  }): Promise<DuplicateFlagCandidate>;
  existsOpenFlag(playerId: string, suspectedDuplicatePlayerId: string): Promise<boolean>;
  listOpen(): Promise<DuplicateFlagCandidate[]>;
  resolve(id: string, status: DuplicateFlagStatus): Promise<DuplicateFlagCandidate>;
}
