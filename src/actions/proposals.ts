"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireSessionUser } from "@/lib/auth/session";
import { proposalSchema, proposalStatusSchema } from "@/lib/validations/opportunity";
import { emitEvent } from "@/lib/events/emitter";
import { leadVisibilityWhere } from "@/lib/scope";
import { proposalItemsTotal } from "@/lib/proposal-items";

export async function createProposalAction(input: unknown) {
  const user = await requireSessionUser();
  const parsed = proposalSchema.parse(input);

  const lead = await db.lead.findFirst({
    where: { id: parsed.leadId, ...leadVisibilityWhere(user) },
  });
  if (!lead) throw new Error("Lead inválido.");

  if (parsed.opportunityId) {
    const opportunity = await db.opportunity.findFirst({
      where: { id: parsed.opportunityId, workspaceId: user.workspaceId, leadId: lead.id },
    });
    if (!opportunity) throw new Error("Oportunidade inválida.");
  }

  const items = parsed.items?.length ? parsed.items : [];
  const value = items.length > 0 ? proposalItemsTotal(items) : parsed.value ?? 0;
  if (items.length === 0 && (!parsed.value || parsed.value <= 0)) {
    throw new Error("Informe um valor ou pelo menos um item.");
  }

  const proposal = await db.proposal.create({
    data: {
      workspaceId: user.workspaceId,
      leadId: lead.id,
      opportunityId: parsed.opportunityId || null,
      title: parsed.title?.trim() || "Proposta",
      value,
      description: parsed.description || null,
      items: items.length ? (items as Prisma.InputJsonValue) : undefined,
      sentAt: parsed.sentAt ? new Date(parsed.sentAt) : parsed.status === "SENT" ? new Date() : null,
      validUntil: parsed.validUntil ? new Date(parsed.validUntil) : null,
      status: parsed.status,
    },
  });

  await emitEvent({
    name: "proposal.created",
    workspaceId: user.workspaceId,
    actorId: user.id,
    leadId: lead.id,
    opportunityId: parsed.opportunityId,
    title: "Proposta registrada",
    description: parsed.description,
    metadata: { value, status: parsed.status },
  });

  revalidatePath(`/leads/${lead.id}`);
  revalidatePath("/opportunities");
  revalidatePath("/proposals");
  return { id: proposal.id };
}

export async function updateProposalStatusAction(input: unknown) {
  const user = await requireSessionUser();
  const parsed = proposalStatusSchema.parse(input);

  const proposal = await db.proposal.findFirst({
    where: { id: parsed.id, workspaceId: user.workspaceId, lead: leadVisibilityWhere(user) },
  });
  if (!proposal) throw new Error("Proposta não encontrada.");

  await db.proposal.update({
    where: { id: proposal.id },
    data: {
      status: parsed.status,
      sentAt: parsed.status === "SENT" && !proposal.sentAt ? new Date() : proposal.sentAt,
    },
  });

  await emitEvent({
    name: "proposal.status_changed",
    workspaceId: user.workspaceId,
    actorId: user.id,
    leadId: proposal.leadId,
    opportunityId: proposal.opportunityId,
    title: "Status da proposta atualizado",
    metadata: { status: parsed.status },
  });

  revalidatePath("/proposals");
  revalidatePath(`/proposals/${proposal.id}`);
  revalidatePath(`/leads/${proposal.leadId}`);
}
