import type { AuditLogRepository } from "../../../src/domain/repositories/AuditLogRepository";

export class InMemoryAuditLogRepository implements AuditLogRepository {
  entries: Array<Parameters<AuditLogRepository["record"]>[0]> = [];

  async record(entry: Parameters<AuditLogRepository["record"]>[0]): Promise<void> {
    this.entries.push(entry);
  }
}
