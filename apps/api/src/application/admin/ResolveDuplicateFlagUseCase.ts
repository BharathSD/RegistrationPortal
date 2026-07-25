import type { DuplicateFlagRepository } from "../../domain/repositories/DuplicateFlagRepository";
import type { AuditLogRepository } from "../../domain/repositories/AuditLogRepository";
import type { DuplicateFlagStatus } from "@cricket-platform/shared";

export function makeResolveDuplicateFlagUseCase({
  duplicateFlagRepo,
  auditLogRepo,
}: {
  duplicateFlagRepo: DuplicateFlagRepository;
  auditLogRepo: AuditLogRepository;
}) {
  return async function resolveDuplicateFlag(flagId: string, resolution: DuplicateFlagStatus, adminId: string) {
    const flag = await duplicateFlagRepo.resolve(flagId, resolution);
    await auditLogRepo.record({
      actorAdminId: adminId,
      action: "DUPLICATE_FLAG_RESOLVED",
      entityType: "DuplicateFlag",
      entityId: flagId,
      after: { resolution },
    });
    return flag;
  };
}
