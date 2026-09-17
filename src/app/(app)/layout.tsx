import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getSessionUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { resolveBrand } from "@/lib/branding";
import { syncDueReminders } from "@/lib/notifications/sync";

export async function generateMetadata(): Promise<Metadata> {
  const user = await getSessionUser();
  const brand = resolveBrand(user?.workspace);
  return {
    title: brand.name,
    icons: brand.faviconUrl ? [{ rel: "icon", url: brand.faviconUrl }] : undefined,
  };
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!user.workspace.onboardingDone) redirect("/onboarding");

  await syncDueReminders(user);

  const notifications = await db.notification.findMany({
    where: { workspaceId: user.workspaceId, userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 12,
  });

  return (
    <AppShell user={user} notifications={notifications}>
      {children}
    </AppShell>
  );
}
