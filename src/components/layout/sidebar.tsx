"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { UserRole } from "@prisma/client";
import { BrandMark } from "@/components/brand/brand-mark";
import { bottomNav, mainNav } from "@/components/layout/nav-config";
import { hasPermission, type Permission } from "@/lib/auth/permissions";
import { cn } from "@/lib/utils";
import type { WorkspaceBrand } from "@/lib/branding";

type SidebarProps = {
  brand: WorkspaceBrand;
  userName: string;
  role: UserRole;
};

export function Sidebar({ brand, userName, role }: SidebarProps) {
  return (
    <aside className="hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground print:hidden lg:flex">
      <SidebarBody brand={brand} userName={userName} role={role} />
    </aside>
  );
}

export function SidebarBody({ brand, userName, role }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-5 py-5">
        <BrandMark name={brand.name} logoUrl={brand.logoUrl} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{brand.name}</p>
          <p className="text-xs text-sidebar-foreground/60">CRM</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {mainNav
          .filter((item) => !item.permission || hasPermission(role, item.permission as Permission))
          .map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-white"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-white",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
      </nav>
      <div className="space-y-1 border-t border-sidebar-border px-3 py-4">
        {bottomNav
          .filter((item) => !item.permission || hasPermission(role, item.permission as Permission))
          .map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-white"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-white",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        <div className="mt-3 px-3 text-xs text-sidebar-foreground/50">{userName}</div>
      </div>
    </div>
  );
}
