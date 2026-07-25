import type { AdminUser, AdminRole } from "@cricket-platform/shared";

export interface AdminUserRecord extends AdminUser {
  passwordHash: string;
}

export interface AdminUserRepository {
  findByEmail(email: string): Promise<AdminUserRecord | null>;
  findById(id: string): Promise<AdminUserRecord | null>;
  create(data: { email: string; passwordHash: string; fullName: string; role: AdminRole }): Promise<AdminUserRecord>;
}
