import { BrandApplier } from "@/components/brand/brand-applier";
import { DeveloperCredit } from "@/components/brand/developer-credit";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { resolveBrand } from "@/lib/branding";
import type { SessionUser } from "@/lib/auth/session";

export function AppShell({
  user,
  notifications,
  children,
}: {
  user: SessionUser;
  notifications: {
    id: string;
    title: string;
    body: string | null;
    link: string | null;
    readAt: Date | null;
    createdAt: Date;
  }[];
  children: React.ReactNode;
}) {
  const brand = resolveBrand(user.workspace);

  return (
    <div className="flex min-h-screen bg-background">
      <BrandApplier brand={brand} />
      <Sidebar brand={brand} userName={user.name} role={user.role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header user={user} notifications={notifications} />
        <main className="flex-1 px-4 py-6 lg:px-8 print:px-0 print:py-0">{children}</main>
        <DeveloperCredit visible={brand.showDeveloperCredit} />
      </div>
    </div>
  );
}
