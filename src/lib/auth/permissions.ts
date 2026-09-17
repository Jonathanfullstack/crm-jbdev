import type { UserRole } from "@prisma/client";

export type Permission =
  | "leads:read-all"
  | "leads:read-own"
  | "leads:write"
  | "leads:reassign"
  | "reports:read"
  | "users:manage"
  | "settings:manage"
  | "stages:manage"
  | "workspace:manage";

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ADMIN: [
    "leads:read-all",
    "leads:read-own",
    "leads:write",
    "leads:reassign",
    "reports:read",
    "users:manage",
    "settings:manage",
    "stages:manage",
    "workspace:manage",
  ],
  MANAGER: [
    "leads:read-all",
    "leads:read-own",
    "leads:write",
    "leads:reassign",
    "reports:read",
  ],
  SELLER: ["leads:read-own", "leads:write"],
};

export function hasPermission(role: UserRole, permission: Permission) {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function canViewAllLeads(role: UserRole) {
  return hasPermission(role, "leads:read-all");
}

export function assertPermission(role: UserRole, permission: Permission) {
  if (!hasPermission(role, permission)) {
    throw new Error("Você não tem permissão para esta ação.");
  }
}
