export interface AuditLogRepository {
  record(entry: {
    actorAdminId?: string | null;
    action: string;
    entityType: string;
    entityId: string;
    before?: unknown;
    after?: unknown;
    ipAddress?: string | null;
  }): Promise<void>;
}
