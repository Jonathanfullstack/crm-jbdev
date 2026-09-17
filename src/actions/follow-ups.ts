"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSessionUser } from "@/lib/auth/session";
import { emitEvent } from "@/lib/events/emitter";
import { followUpSchema } from "@/lib/validations/follow-up";
import { leadVisibilityWhere } from "@/lib/scope";

export async function createFollowUpAction(input: unknown) {
  const user = await requireSessionUser();
  const parsed = followUpSchema.parse(input);

  const lead = await db.lead.findFirst({
    where: { id: parsed.leadId, ...leadVisibilityWhere(user) },
  });
  if (!lead) throw new Error("Lead inválido.");

  const owner = await db.user.findFirst({
    where: { id: parsed.ownerId, workspaceId: user.workspaceId },
  });
  if (!owner) throw new Error("Responsável inválido.");

  const dueAt = new Date(parsed.dueAt);
  const followUp = await db.followUp.create({
    data: {
      workspaceId: user.workspaceId,
      leadId: lead.id,
      ownerId: owner.id,
      type: parsed.type,
      description: parsed.description || null,
      dueAt,
      priority: parsed.priority,
    },
  });

  await db.lead.update({
    where: { id: lead.id },
    data: { nextFollowUpAt: dueAt },
  });

  await emitEvent({
    name: "followup.created",
    workspaceId: user.workspaceId,
    actorId: user.id,
    leadId: lead.id,
    title: "Follow-up agendado",
    description: parsed.description,
  });

  revalidatePath("/follow-ups");
  revalidatePath(`/leads/${lead.id}`);
  revalidatePath("/");
  return { id: followUp.id };
}

export async function completeFollowUpAction(followUpId: string) {
  const user = await requireSessionUser();
  const followUp = await db.followUp.findFirst({
    where: { id: followUpId, workspaceId: user.workspaceId },
  });
  if (!followUp) throw new Error("Follow-up não encontrado.");
  if (user.role === "SELLER" && followUp.ownerId !== user.id) {
    throw new Error("Você não pode concluir este follow-up.");
  }

  await db.followUp.update({
    where: { id: followUp.id },
    data: { completedAt: new Date() },
  });

  const next = await db.followUp.findFirst({
    where: {
      workspaceId: user.workspaceId,
      leadId: followUp.leadId,
      completedAt: null,
    },
    orderBy: { dueAt: "asc" },
  });

  await db.lead.update({
    where: { id: followUp.leadId },
    data: { nextFollowUpAt: next?.dueAt ?? null, lastContactAt: new Date() },
  });

  await emitEvent({
    name: "followup.completed",
    workspaceId: user.workspaceId,
    actorId: user.id,
    leadId: followUp.leadId,
    title: "Follow-up concluído",
  });

  revalidatePath("/follow-ups");
  revalidatePath(`/leads/${followUp.leadId}`);
  revalidatePath("/");
}
