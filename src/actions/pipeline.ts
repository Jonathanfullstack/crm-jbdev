"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSessionUser } from "@/lib/auth/session";
import { assertPermission } from "@/lib/auth/permissions";
import { stageSchema } from "@/lib/validations/settings";

export async function upsertStageAction(input: unknown) {
  const user = await requireSessionUser();
  assertPermission(user.role, "stages:manage");
  const parsed = stageSchema.parse(input);

  const pipeline = await db.pipeline.findFirst({
    where: { workspaceId: user.workspaceId, isDefault: true },
  });
  if (!pipeline) throw new Error("Funil não encontrado.");

  if (parsed.id) {
    const existing = await db.pipelineStage.findFirst({
      where: { id: parsed.id, workspaceId: user.workspaceId },
    });
    if (!existing) throw new Error("Etapa não encontrada.");

    await db.pipelineStage.update({
      where: { id: existing.id },
      data: {
        name: parsed.name,
        color: parsed.color,
        kind: parsed.kind,
        isHidden: parsed.isHidden ?? existing.isHidden,
        position: parsed.position,
      },
    });
  } else {
    await db.pipelineStage.create({
      data: {
        workspaceId: user.workspaceId,
        pipelineId: pipeline.id,
        name: parsed.name,
        color: parsed.color,
        kind: parsed.kind,
        isHidden: parsed.isHidden ?? false,
        position: parsed.position,
      },
    });
  }

  revalidatePath("/settings");
  revalidatePath("/pipeline");
}

export async function reorderStagesAction(orderedIds: string[]) {
  const user = await requireSessionUser();
  assertPermission(user.role, "stages:manage");

  const stages = await db.pipelineStage.findMany({
    where: { workspaceId: user.workspaceId, id: { in: orderedIds } },
  });
  if (stages.length !== orderedIds.length) {
    throw new Error("Etapas inválidas.");
  }

  await db.$transaction(
    orderedIds.map((id, index) =>
      db.pipelineStage.update({
        where: { id },
        data: { position: index },
      }),
    ),
  );

  revalidatePath("/settings");
  revalidatePath("/pipeline");
}

export async function toggleStageVisibilityAction(stageId: string, isHidden: boolean) {
  const user = await requireSessionUser();
  assertPermission(user.role, "stages:manage");

  const stage = await db.pipelineStage.findFirst({
    where: { id: stageId, workspaceId: user.workspaceId },
  });
  if (!stage) throw new Error("Etapa não encontrada.");

  await db.pipelineStage.update({
    where: { id: stage.id },
    data: { isHidden },
  });

  revalidatePath("/settings");
  revalidatePath("/pipeline");
}
