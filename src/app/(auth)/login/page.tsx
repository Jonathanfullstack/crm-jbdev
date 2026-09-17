import { LoginForm } from "@/components/auth/login-form";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { NEUTRAL_BRAND, resolveBrand } from "@/lib/branding";
import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { w?: string };
}) {
  const slug = searchParams.w?.trim();
  const sessionUser = await getSessionUser();
  if (sessionUser) redirect("/");

  const [workspace, demos] = await Promise.all([
    slug
      ? db.workspace.findUnique({
          where: { slug },
          select: {
            name: true,
            slug: true,
            logoUrl: true,
            faviconUrl: true,
            primaryColor: true,
            secondaryColor: true,
            theme: true,
            showDeveloperCredit: true,
          },
        })
      : Promise.resolve(null),
    db.workspace.findMany({
      where: { slug: { in: ["novatech", "atlas"] } },
      select: { name: true, slug: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const brand = resolveBrand(workspace ?? NEUTRAL_BRAND);
  const demoAccounts = demos
    .filter((item): item is { name: string; slug: string } => Boolean(item.slug))
    .map((item) => ({
      name: item.name,
      slug: item.slug,
      email: item.slug === "atlas" ? "admin@atlas.com" : "admin@novatech.com",
    }));

  return <LoginForm brand={brand} workspaceSlug={workspace?.slug ?? undefined} demos={demoAccounts} />;
}
