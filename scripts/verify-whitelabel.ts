import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const workspaces = await db.workspace.findMany({
    include: {
      _count: { select: { leads: true, users: true } },
    },
  });

  if (workspaces.length < 2) {
    throw new Error("É preciso haver pelo menos dois workspaces.");
  }

  const novatech = workspaces.find((item) => item.slug === "novatech");
  const atlas = workspaces.find((item) => item.slug === "atlas");
  if (!novatech || !atlas) {
    throw new Error("Workspaces novatech e atlas não encontrados.");
  }
  if (novatech.primaryColor === atlas.primaryColor || novatech.name === atlas.name) {
    throw new Error("Os workspaces precisam ter nome e cor diferentes.");
  }

  const leakedIntoNovatech = await db.lead.count({
    where: { workspaceId: novatech.id, email: { contains: "atlas-demo.com" } },
  });
  const leakedIntoAtlas = await db.lead.count({
    where: { workspaceId: atlas.id, email: { contains: "@email.com" } },
  });
  if (leakedIntoNovatech > 0 || leakedIntoAtlas > 0) {
    throw new Error("Dados de um workspace vazaram para o outro.");
  }

  const originalAtlasColor = atlas.primaryColor;
  await db.workspace.update({
    where: { id: novatech.id },
    data: { primaryColor: "#111827" },
  });
  const atlasAfter = await db.workspace.findUniqueOrThrow({ where: { id: atlas.id } });
  if (atlasAfter.primaryColor !== originalAtlasColor) {
    throw new Error("Alterar a aparência de um workspace afetou o outro.");
  }
  await db.workspace.update({
    where: { id: novatech.id },
    data: { primaryColor: novatech.primaryColor },
  });

  console.log("White-label ok:");
  for (const workspace of workspaces) {
    console.log(
      `  ${workspace.name} · ${workspace.primaryColor} · ${workspace._count.users} usuários · ${workspace._count.leads} leads`,
    );
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
