"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSessionUser } from "@/lib/auth/session";
import { assertPermission } from "@/lib/auth/permissions";
import { hashPassword } from "@/lib/auth/password";
import { userSchema } from "@/lib/validations/user";

export async function createUserAction(input: unknown) {
  const current = await requireSessionUser();
  assertPermission(current.role, "users:manage");
  const parsed = userSchema.parse(input);
  if (!parsed.password) throw new Error("Defina uma senha inicial.");

  const exists = await db.user.findFirst({
    where: {
      workspaceId: current.workspaceId,
      email: parsed.email.toLowerCase(),
    },
  });
  if (exists) throw new Error("Já existe um usuário com este e-mail.");

  await db.user.create({
    data: {
      workspaceId: current.workspaceId,
      name: parsed.name.trim(),
      email: parsed.email.toLowerCase(),
      passwordHash: await hashPassword(parsed.password),
      role: parsed.role,
      status: parsed.status,
    },
  });

  revalidatePath("/users");
}

export async function updateUserAction(userId: string, input: unknown) {
  const current = await requireSessionUser();
  assertPermission(current.role, "users:manage");
  const parsed = userSchema.parse(input);

  const target = await db.user.findFirst({
    where: { id: userId, workspaceId: current.workspaceId },
  });
  if (!target) throw new Error("Usuário não encontrado.");

  await db.user.update({
    where: { id: target.id },
    data: {
      name: parsed.name.trim(),
      email: parsed.email.toLowerCase(),
      role: parsed.role,
      status: parsed.status,
      ...(parsed.password
        ? { passwordHash: await hashPassword(parsed.password) }
        : {}),
    },
  });

  revalidatePath("/users");
}

export async function toggleUserStatusAction(userId: string) {
  const current = await requireSessionUser();
  assertPermission(current.role, "users:manage");

  const target = await db.user.findFirst({
    where: { id: userId, workspaceId: current.workspaceId },
  });
  if (!target) throw new Error("Usuário não encontrado.");
  if (target.id === current.id) throw new Error("Você não pode desativar a si mesmo.");

  await db.user.update({
    where: { id: target.id },
    data: { status: target.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" },
  });

  if (target.status === "ACTIVE") {
    await db.session.deleteMany({ where: { userId: target.id } });
  }

  revalidatePath("/users");
}
