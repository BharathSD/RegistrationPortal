import type { DuplicateFlagRepository } from "../../domain/repositories/DuplicateFlagRepository";

export function makeListDuplicateFlagsUseCase({ duplicateFlagRepo }: { duplicateFlagRepo: DuplicateFlagRepository }) {
  return async function listDuplicateFlags() {
    return duplicateFlagRepo.listOpen();
  };
}
