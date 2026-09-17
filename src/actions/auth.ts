"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { loginSchema } from "@/lib/validations/auth";
import { verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession } from "@/lib/auth/session";

export async function loginAction(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    workspaceSlug: formData.get("workspaceSlug") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const email = parsed.data.email.toLowerCase();
  const matches = await db.user.findMany({
    where: {
      email,
      status: "ACTIVE",
      ...(parsed.data.workspaceSlug
        ? { workspace: { slug: parsed.data.workspaceSlug } }
        : {}),
    },
    include: { workspace: true },
  });

  if (matches.length > 1 && !parsed.data.workspaceSlug) {
    return { error: "Este e-mail existe em mais de uma empresa. Use o link de acesso da sua empresa." };
  }

  const user = matches[0];
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return { error: "E-mail ou senha incorretos." };
  }

  await createSession(user.id);
  redirect("/");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
