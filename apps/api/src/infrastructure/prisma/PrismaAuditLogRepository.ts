import type { PrismaClient, Prisma } from "@prisma/client";
import type { AuditLogRepository } from "../../domain/repositories/AuditLogRepository";

export class PrismaAuditLogRepository implements AuditLogRepository {
  constructor(private readonly db: PrismaClient) {}

  async record(entry: {
    actorAdminId?: string | null;
    action: string;
    entityType: string;
    entityId: string;
    before?: unknown;
    after?: unknown;
    ipAddress?: string | null;
  }): Promise<void> {
    await this.db.auditLog.create({
      data: {
        actorAdminId: entry.actorAdminId ?? null,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        before: (entry.before ?? undefined) as Prisma.InputJsonValue,
        after: (entry.after ?? undefined) as Prisma.InputJsonValue,
        ipAddress: entry.ipAddress ?? null,
      },
    });
  }
}
