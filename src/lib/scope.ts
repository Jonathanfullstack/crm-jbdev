import type { Prisma } from "@prisma/client";
import type { SessionUser } from "@/lib/auth/session";
import { canViewAllLeads } from "@/lib/auth/permissions";

export function workspaceWhere(workspaceId: string) {
  return { workspaceId };
}

export function leadVisibilityWhere(user: SessionUser): Prisma.LeadWhereInput {
  if (canViewAllLeads(user.role)) {
    return { workspaceId: user.workspaceId };
  }
  return { workspaceId: user.workspaceId, ownerId: user.id };
}
