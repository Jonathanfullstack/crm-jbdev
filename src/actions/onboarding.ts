"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireSessionUser } from "@/lib/auth/session";
import { onboardingSchema } from "@/lib/validations/settings";
import { NEUTRAL_BRAND } from "@/lib/branding";

export async function completeOnboardingAction(input: unknown) {
  const user = await requireSessionUser();
  const parsed = onboardingSchema.parse(input);

  await db.workspace.update({
    where: { id: user.workspaceId },
    data: {
      name: parsed.companyName.trim() || NEUTRAL_BRAND.name,
      logoUrl: parsed.logoUrl || null,
      primaryColor: parsed.primaryColor || NEUTRAL_BRAND.primaryColor,
      theme: parsed.theme ?? "SYSTEM",
      onboardingDone: true,
    },
  });

  redirect("/");
}

export async function skipOnboardingAction() {
  const user = await requireSessionUser();
  await db.workspace.update({
    where: { id: user.workspaceId },
    data: { onboardingDone: true },
  });
  redirect("/");
}
