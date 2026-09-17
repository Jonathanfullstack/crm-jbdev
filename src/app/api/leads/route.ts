import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth/session";
import { leadSchema } from "@/lib/validations/lead";
import { emitEvent } from "@/lib/events/emitter";
import { listLeads } from "@/lib/queries/leads";

async function resolveWorkspaceFromApiKey(request: Request) {
  const header = request.headers.get("authorization") ?? request.headers.get("x-api-key");
  if (!header) return null;
  const token = header.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;
  const apiKey = await db.apiKey.findFirst({
    where: { tokenHash: createHash("sha256").update(token).digest("hex"), revokedAt: null },
  });
  if (!apiKey) return null;
  await db.apiKey.update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } });
  return apiKey.workspaceId;
}

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (user) {
    const leads = await listLeads(user);
    return NextResponse.json({ data: leads });
  }

  const workspaceId = await resolveWorkspaceFromApiKey(request);
  if (!workspaceId) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const leads = await db.lead.findMany({
    where: { workspaceId },
    include: { stage: true, owner: { select: { id: true, name: true } }, source: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return NextResponse.json({ data: leads });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const user = await getSessionUser();
  const workspaceId = user?.workspaceId ?? (await resolveWorkspaceFromApiKey(request));
  if (!workspaceId) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const stage = parsed.data.stageId
    ? await db.pipelineStage.findFirst({ where: { id: parsed.data.stageId, workspaceId } })
    : await db.pipelineStage.findFirst({ where: { workspaceId }, orderBy: { position: "asc" } });
  if (!stage) {
    return NextResponse.json({ error: "Etapa inválida." }, { status: 400 });
  }

  const lead = await db.lead.create({
    data: {
      workspaceId,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName || null,
      companyName: parsed.data.companyName || null,
      phone: parsed.data.phone || null,
      whatsapp: parsed.data.whatsapp || null,
      email: parsed.data.email || null,
      sourceId: parsed.data.sourceId || null,
      stageId: stage.id,
      ownerId: user?.id ?? parsed.data.ownerId ?? null,
      estimatedValue: parsed.data.estimatedValue ?? null,
      notes: parsed.data.notes || null,
    },
  });

  await emitEvent({
    name: "lead.created",
    workspaceId,
    actorId: user?.id,
    leadId: lead.id,
    title: "Lead criado via API",
  });

  return NextResponse.json({ data: { id: lead.id } }, { status: 201 });
}
