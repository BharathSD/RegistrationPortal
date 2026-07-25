import type { PrismaClient } from "@prisma/client";
import type { AdminUserRepository, AdminUserRecord } from "../../domain/repositories/AdminUserRepository";
import type { AdminRole } from "@cricket-platform/shared";

export class PrismaAdminUserRepository implements AdminUserRepository {
  constructor(private readonly db: PrismaClient) {}

  async findByEmail(email: string): Promise<AdminUserRecord | null> {
    return this.db.adminUser.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<AdminUserRecord | null> {
    return this.db.adminUser.findUnique({ where: { id } });
  }

  async create(data: {
    email: string;
    passwordHash: string;
    fullName: string;
    role: AdminRole;
  }): Promise<AdminUserRecord> {
    return this.db.adminUser.create({ data });
  }
}
