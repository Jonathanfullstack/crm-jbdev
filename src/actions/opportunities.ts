"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSessionUser } from "@/lib/auth/session";
import { opportunitySchema, opportunityStatusSchema } from "@/lib/validations/opportunity";
import { leadVisibilityWhere } from "@/lib/scope";

export async function createOpportunityAction(input: unknown) {
  const user = await requireSessionUser();
  const parsed = opportunitySchema.parse(input);

  const lead = await db.lead.findFirst({
    where: { id: parsed.leadId, ...leadVisibilityWhere(user) },
  });
  if (!lead) throw new Error("Lead inválido.");

  const stage = parsed.stageId
    ? await db.pipelineStage.findFirst({
        where: { id: parsed.stageId, workspaceId: user.workspaceId },
      })
    : await db.pipelineStage.findFirst({
        where: { workspaceId: user.workspaceId },
        orderBy: { position: "asc" },
      });
  if (!stage) throw new Error("Etapa inválida.");

  const opportunity = await db.opportunity.create({
    data: {
      workspaceId: user.workspaceId,
      title: parsed.title.trim(),
      leadId: lead.id,
      productId: parsed.productId || null,
      value: parsed.value ?? null,
      stageId: stage.id,
      probability: parsed.probability ?? null,
      ownerId: parsed.ownerId || user.id,
      expectedClose: parsed.expectedClose ? new Date(parsed.expectedClose) : null,
    },
  });

  revalidatePath("/opportunities");
  revalidatePath(`/leads/${lead.id}`);
  return { id: opportunity.id };
}

export async function updateOpportunityStatusAction(input: unknown) {
  const user = await requireSessionUser();
  const parsed = opportunityStatusSchema.parse(input);

  const opportunity = await db.opportunity.findFirst({
    where: { id: parsed.id, workspaceId: user.workspaceId, lead: leadVisibilityWhere(user) },
    include: { stage: true },
  });
  if (!opportunity) throw new Error("Oportunidade não encontrada.");

  if (parsed.status === "LOST" && !parsed.lostReasonId) {
    throw new Error("Selecione um motivo de perda.");
  }

  const nextStage =
    parsed.status === "OPEN"
      ? opportunity.stage
      : await db.pipelineStage.findFirst({
          where: {
            workspaceId: user.workspaceId,
            kind: parsed.status === "WON" ? "WON" : "LOST",
          },
          orderBy: { position: parsed.status === "WON" ? "desc" : "asc" },
        });

  await db.opportunity.update({
    where: { id: opportunity.id },
    data: {
      status: parsed.status,
      closedAt: parsed.status === "OPEN" ? null : new Date(),
      lostReasonId: parsed.status === "LOST" ? parsed.lostReasonId : null,
      lostNotes: parsed.status === "LOST" ? parsed.lostNotes || null : null,
      stageId: nextStage?.id ?? opportunity.stageId,
      probability: parsed.status === "WON" ? 100 : parsed.status === "LOST" ? 0 : opportunity.probability,
    },
  });

  revalidatePath("/opportunities");
  revalidatePath(`/leads/${opportunity.leadId}`);
  revalidatePath("/");
}
