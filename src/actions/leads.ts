"use server";

import { revalidatePath } from "next/cache";
import { StageKind } from "@prisma/client";
import { db } from "@/lib/db";
import { requireSessionUser } from "@/lib/auth/session";
import { assertPermission, canViewAllLeads } from "@/lib/auth/permissions";
import { emitEvent } from "@/lib/events/emitter";
import { leadSchema, moveLeadSchema, reassignLeadSchema } from "@/lib/validations/lead";
import { leadVisibilityWhere } from "@/lib/scope";
import { fullName } from "@/lib/utils";

function emptyToNull(value?: string | null) {
  if (!value || value.trim() === "") return null;
  return value;
}

export async function createLeadAction(input: unknown) {
  const user = await requireSessionUser();
  const parsed = leadSchema.parse(input);

  const defaultStage = parsed.stageId
    ? await db.pipelineStage.findFirst({
        where: { id: parsed.stageId, workspaceId: user.workspaceId },
      })
    : await db.pipelineStage.findFirst({
        where: { workspaceId: user.workspaceId, isHidden: false },
        orderBy: { position: "asc" },
      });

  if (!defaultStage) {
    throw new Error("Nenhuma etapa disponível.");
  }

  let ownerId = parsed.ownerId || user.id;
  if (!canViewAllLeads(user.role)) {
    ownerId = user.id;
  } else if (parsed.ownerId) {
    const owner = await db.user.findFirst({
      where: { id: parsed.ownerId, workspaceId: user.workspaceId },
    });
    if (!owner) throw new Error("Responsável inválido.");
    ownerId = owner.id;
  }

  if (parsed.companyId) {
    const company = await db.company.findFirst({
      where: { id: parsed.companyId, workspaceId: user.workspaceId },
    });
    if (!company) throw new Error("Empresa inválida.");
  }

  const lead = await db.lead.create({
    data: {
      workspaceId: user.workspaceId,
      firstName: parsed.firstName.trim(),
      lastName: emptyToNull(parsed.lastName),
      companyName: emptyToNull(parsed.companyName),
      companyId: emptyToNull(parsed.companyId),
      phone: emptyToNull(parsed.phone),
      whatsapp: emptyToNull(parsed.whatsapp),
      email: emptyToNull(parsed.email),
      jobTitle: emptyToNull(parsed.jobTitle),
      city: emptyToNull(parsed.city),
      state: emptyToNull(parsed.state),
      sourceId: emptyToNull(parsed.sourceId),
      stageId: defaultStage.id,
      ownerId,
      estimatedValue: parsed.estimatedValue ?? null,
      probability: parsed.probability ?? null,
      interest: emptyToNull(parsed.interest),
      notes: emptyToNull(parsed.notes),
      lastContactAt: new Date(),
      tags: parsed.tagIds?.length
        ? {
            create: parsed.tagIds.map((tagId) => ({ tagId })),
          }
        : undefined,
    },
  });

  await emitEvent({
    name: "lead.created",
    workspaceId: user.workspaceId,
    actorId: user.id,
    leadId: lead.id,
    title: "Lead criado",
    description: `${fullName(lead.firstName, lead.lastName)} entrou no funil.`,
  });

  revalidatePath("/leads");
  revalidatePath("/pipeline");
  revalidatePath("/");
  return { id: lead.id };
}

export async function updateLeadAction(leadId: string, input: unknown) {
  const user = await requireSessionUser();
  const parsed = leadSchema.parse(input);

  const existing = await db.lead.findFirst({
    where: { id: leadId, ...leadVisibilityWhere(user) },
  });
  if (!existing) throw new Error("Lead não encontrado.");

  const nextValue = parsed.estimatedValue ?? null;
  const prevValue = existing.estimatedValue ? Number(existing.estimatedValue) : null;

  await db.lead.update({
    where: { id: existing.id },
    data: {
      firstName: parsed.firstName.trim(),
      lastName: emptyToNull(parsed.lastName),
      companyName: emptyToNull(parsed.companyName),
      companyId: emptyToNull(parsed.companyId),
      phone: emptyToNull(parsed.phone),
      whatsapp: emptyToNull(parsed.whatsapp),
      email: emptyToNull(parsed.email),
      jobTitle: emptyToNull(parsed.jobTitle),
      city: emptyToNull(parsed.city),
      state: emptyToNull(parsed.state),
      sourceId: emptyToNull(parsed.sourceId),
      estimatedValue: nextValue,
      probability: parsed.probability ?? null,
      interest: emptyToNull(parsed.interest),
      notes: emptyToNull(parsed.notes),
      tags: parsed.tagIds
        ? {
            deleteMany: {},
            create: parsed.tagIds.map((tagId) => ({ tagId })),
          }
        : undefined,
    },
  });

  if (prevValue !== nextValue) {
    await emitEvent({
      name: "lead.value_changed",
      workspaceId: user.workspaceId,
      actorId: user.id,
      leadId: existing.id,
      title: "Valor atualizado",
      metadata: { from: prevValue, to: nextValue },
    });
  }

  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");
  revalidatePath("/pipeline");
}

export async function moveLeadAction(input: unknown) {
  const user = await requireSessionUser();
  const parsed = moveLeadSchema.parse(input);

  const lead = await db.lead.findFirst({
    where: { id: parsed.leadId, ...leadVisibilityWhere(user) },
    include: { stage: true },
  });
  if (!lead) throw new Error("Lead não encontrado.");

  const stage = await db.pipelineStage.findFirst({
    where: { id: parsed.stageId, workspaceId: user.workspaceId },
  });
  if (!stage) throw new Error("Etapa inválida.");

  if (stage.kind === StageKind.LOST && !parsed.lostReasonId) {
    throw new Error("Selecione um motivo de perda.");
  }

  if (parsed.lostReasonId) {
    const reason = await db.lostReason.findFirst({
      where: { id: parsed.lostReasonId, workspaceId: user.workspaceId },
    });
    if (!reason) throw new Error("Motivo de perda inválido.");
  }

  const now = new Date();
  await db.lead.update({
    where: { id: lead.id },
    data: {
      stageId: stage.id,
      lastContactAt: now,
      kind: stage.kind === StageKind.WON ? "CLIENT" : lead.kind,
      convertedAt: stage.kind === StageKind.WON ? now : lead.convertedAt,
      lostReasonId: stage.kind === StageKind.LOST ? parsed.lostReasonId : null,
      lostNotes: stage.kind === StageKind.LOST ? emptyToNull(parsed.lostNotes) : null,
    },
  });

  const eventName =
    stage.kind === StageKind.WON
      ? "lead.won"
      : stage.kind === StageKind.LOST
        ? "lead.lost"
        : "lead.stage_changed";

  await emitEvent({
    name: eventName,
    workspaceId: user.workspaceId,
    actorId: user.id,
    leadId: lead.id,
    title: stage.kind === StageKind.WON ? "Negócio fechado" : "Etapa alterada",
    description: `${lead.stage.name} → ${stage.name}`,
    metadata: { from: lead.stage.name, to: stage.name },
  });

  if (stage.kind === StageKind.WON) {
    await db.activity.create({
      data: {
        workspaceId: user.workspaceId,
        leadId: lead.id,
        actorId: user.id,
        type: "CONVERTED",
        title: "Convertido em cliente",
        description: "O lead passou a ser cliente automaticamente.",
      },
    });
  }

  revalidatePath("/pipeline");
  revalidatePath("/leads");
  revalidatePath(`/leads/${lead.id}`);
  revalidatePath("/");
}

export async function reassignLeadAction(input: unknown) {
  const user = await requireSessionUser();
  assertPermission(user.role, "leads:reassign");
  const parsed = reassignLeadSchema.parse(input);

  const lead = await db.lead.findFirst({
    where: { id: parsed.leadId, workspaceId: user.workspaceId },
  });
  if (!lead) throw new Error("Lead não encontrado.");

  if (parsed.ownerId) {
    const owner = await db.user.findFirst({
      where: { id: parsed.ownerId, workspaceId: user.workspaceId },
    });
    if (!owner) throw new Error("Responsável inválido.");
  }

  await db.lead.update({
    where: { id: lead.id },
    data: { ownerId: parsed.ownerId },
  });

  await emitEvent({
    name: "lead.assigned",
    workspaceId: user.workspaceId,
    actorId: user.id,
    leadId: lead.id,
    title: "Responsável alterado",
  });

  revalidatePath("/leads");
  revalidatePath(`/leads/${lead.id}`);
  revalidatePath("/pipeline");
}

export async function importLeadsAction(rows: unknown[]) {
  const user = await requireSessionUser();
  const defaultStage = await db.pipelineStage.findFirst({
    where: { workspaceId: user.workspaceId, isHidden: false },
    orderBy: { position: "asc" },
  });
  if (!defaultStage) throw new Error("Nenhuma etapa disponível.");

  let created = 0;
  for (const row of rows) {
    const parsed = leadSchema.safeParse(row);
    if (!parsed.success) continue;

    await db.lead.create({
      data: {
        workspaceId: user.workspaceId,
        firstName: parsed.data.firstName.trim(),
        lastName: emptyToNull(parsed.data.lastName),
        companyName: emptyToNull(parsed.data.companyName),
        phone: emptyToNull(parsed.data.phone),
        whatsapp: emptyToNull(parsed.data.whatsapp),
        email: emptyToNull(parsed.data.email),
        stageId: defaultStage.id,
        ownerId: canViewAllLeads(user.role) ? parsed.data.ownerId || user.id : user.id,
        estimatedValue: parsed.data.estimatedValue ?? null,
        notes: emptyToNull(parsed.data.notes),
      },
    });
    created += 1;
  }

  revalidatePath("/leads");
  revalidatePath("/pipeline");
  revalidatePath("/");
  return { created };
}

export async function addNoteAction(leadId: string, content: string) {
  const user = await requireSessionUser();
  if (!content.trim()) throw new Error("Escreva uma observação.");

  const lead = await db.lead.findFirst({
    where: { id: leadId, ...leadVisibilityWhere(user) },
  });
  if (!lead) throw new Error("Lead não encontrado.");

  await db.note.create({
    data: {
      workspaceId: user.workspaceId,
      leadId: lead.id,
      authorId: user.id,
      content: content.trim(),
    },
  });

  await db.lead.update({
    where: { id: lead.id },
    data: { lastContactAt: new Date() },
  });

  await emitEvent({
    name: "note.created",
    workspaceId: user.workspaceId,
    actorId: user.id,
    leadId: lead.id,
    title: "Observação adicionada",
    description: content.trim(),
  });

  revalidatePath(`/leads/${lead.id}`);
}
