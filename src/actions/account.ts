"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSessionUser } from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { changePasswordSchema } from "@/lib/validations/account";

export async function changePasswordAction(input: unknown) {
  const user = await requireSessionUser();
  const parsed = changePasswordSchema.parse(input);

  const account = await db.user.findFirst({
    where: { id: user.id, workspaceId: user.workspaceId },
    select: { passwordHash: true },
  });
  if (!account) throw new Error("Usuário não encontrado.");

  const valid = await verifyPassword(parsed.currentPassword, account.passwordHash);
  if (!valid) throw new Error("Senha atual incorreta.");

  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(parsed.newPassword) },
  });

  revalidatePath("/account");
}
