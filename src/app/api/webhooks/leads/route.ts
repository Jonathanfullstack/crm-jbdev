import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { db } from "@/lib/db";
import { leadSchema } from "@/lib/validations/lead";
import { emitEvent } from "@/lib/events/emitter";

export async function POST(request: Request) {
  const header = request.headers.get("x-api-key") ?? request.headers.get("authorization");
  const token = header?.replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return NextResponse.json({ error: "API key obrigatória." }, { status: 401 });
  }

  const apiKey = await db.apiKey.findFirst({
    where: {
      tokenHash: createHash("sha256").update(token).digest("hex"),
      revokedAt: null,
    },
  });
  if (!apiKey) {
    return NextResponse.json({ error: "API key inválida." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const stage = await db.pipelineStage.findFirst({
    where: { workspaceId: apiKey.workspaceId },
    orderBy: { position: "asc" },
  });
  if (!stage) {
    return NextResponse.json({ error: "Workspace sem etapas." }, { status: 400 });
  }

  const lead = await db.lead.create({
    data: {
      workspaceId: apiKey.workspaceId,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName || null,
      companyName: parsed.data.companyName || null,
      phone: parsed.data.phone || null,
      whatsapp: parsed.data.whatsapp || null,
      email: parsed.data.email || null,
      sourceId: parsed.data.sourceId || null,
      stageId: stage.id,
      estimatedValue: parsed.data.estimatedValue ?? null,
      notes: parsed.data.notes || null,
    },
  });

  await db.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  });

  await emitEvent({
    name: "lead.created",
    workspaceId: apiKey.workspaceId,
    leadId: lead.id,
    title: "Lead recebido por webhook",
    metadata: { source: "webhook" },
  });

  return NextResponse.json({ data: { id: lead.id } }, { status: 201 });
}
