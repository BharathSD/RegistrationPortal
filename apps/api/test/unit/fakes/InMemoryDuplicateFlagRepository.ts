import crypto from "node:crypto";
import type { DuplicateFlagRepository } from "../../../src/domain/repositories/DuplicateFlagRepository";
import type { DuplicateFlagCandidate } from "../../../src/domain/entities";
import type { DuplicateSignal, DuplicateFlagStatus } from "@cricket-platform/shared";

export class InMemoryDuplicateFlagRepository implements DuplicateFlagRepository {
  flags: DuplicateFlagCandidate[] = [];

  async create(data: {
    playerId: string;
    suspectedDuplicatePlayerId: string;
    signal: DuplicateSignal;
  }): Promise<DuplicateFlagCandidate> {
    const flag: DuplicateFlagCandidate = {
      id: crypto.randomUUID(),
      status: "OPEN",
      createdAt: new Date().toISOString(),
      ...data,
    };
    this.flags.push(flag);
    return flag;
  }

  async existsOpenFlag(playerId: string, suspectedDuplicatePlayerId: string): Promise<boolean> {
    return this.flags.some(
      (f) => f.playerId === playerId && f.suspectedDuplicatePlayerId === suspectedDuplicatePlayerId && f.status === "OPEN",
    );
  }

  async listOpen(): Promise<DuplicateFlagCandidate[]> {
    return this.flags.filter((f) => f.status === "OPEN");
  }

  async resolve(id: string, status: DuplicateFlagStatus): Promise<DuplicateFlagCandidate> {
    const flag = this.flags.find((f) => f.id === id);
    if (!flag) throw new Error("not found");
    flag.status = status;
    return flag;
  }
}
