"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSessionUser } from "@/lib/auth/session";
import { emitEvent } from "@/lib/events/emitter";
import { taskSchema } from "@/lib/validations/task";
import { leadVisibilityWhere } from "@/lib/scope";

export async function createTaskAction(input: unknown) {
  const user = await requireSessionUser();
  const parsed = taskSchema.parse(input);

  const owner = await db.user.findFirst({
    where: { id: parsed.ownerId, workspaceId: user.workspaceId },
  });
  if (!owner) throw new Error("Responsável inválido.");

  if (parsed.leadId) {
    const lead = await db.lead.findFirst({
      where: { id: parsed.leadId, ...leadVisibilityWhere(user) },
    });
    if (!lead) throw new Error("Lead inválido.");
  }

  const task = await db.task.create({
    data: {
      workspaceId: user.workspaceId,
      title: parsed.title.trim(),
      description: parsed.description || null,
      ownerId: owner.id,
      leadId: parsed.leadId || null,
      dueAt: parsed.dueAt ? new Date(parsed.dueAt) : null,
      priority: parsed.priority,
      status: parsed.status,
    },
  });

  if (task.leadId) {
    await emitEvent({
      name: "task.created",
      workspaceId: user.workspaceId,
      actorId: user.id,
      leadId: task.leadId,
      title: "Tarefa criada",
      description: task.title,
    });
  }

  revalidatePath("/tasks");
  revalidatePath("/");
  if (task.leadId) revalidatePath(`/leads/${task.leadId}`);
  return { id: task.id };
}

export async function updateTaskStatusAction(taskId: string, status: "PENDING" | "IN_PROGRESS" | "DONE") {
  const user = await requireSessionUser();
  const task = await db.task.findFirst({
    where: { id: taskId, workspaceId: user.workspaceId },
  });
  if (!task) throw new Error("Tarefa não encontrada.");
  if (user.role === "SELLER" && task.ownerId !== user.id) {
    throw new Error("Você não pode alterar esta tarefa.");
  }

  await db.task.update({
    where: { id: task.id },
    data: { status },
  });

  if (status === "DONE" && task.leadId) {
    await emitEvent({
      name: "task.completed",
      workspaceId: user.workspaceId,
      actorId: user.id,
      leadId: task.leadId,
      title: "Tarefa concluída",
      description: task.title,
    });
  }

  revalidatePath("/tasks");
  revalidatePath("/");
  if (task.leadId) revalidatePath(`/leads/${task.leadId}`);
}
