"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSessionUser } from "@/lib/auth/session";
import { assertPermission } from "@/lib/auth/permissions";
import {
  appearanceSchema,
  lostReasonSchema,
  sourceSchema,
  tagSchema,
  workspaceSettingsSchema,
} from "@/lib/validations/settings";
import { NEUTRAL_BRAND } from "@/lib/branding";

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function updateWorkspaceAction(input: unknown) {
  const user = await requireSessionUser();
  assertPermission(user.role, "settings:manage");
  const parsed = workspaceSettingsSchema.parse(input);

  await db.workspace.update({
    where: { id: user.workspaceId },
    data: {
      name: parsed.name.trim(),
      phone: parsed.phone || null,
      email: parsed.email || null,
      website: parsed.website || null,
    },
  });

  revalidatePath("/settings");
}

export async function updateAppearanceAction(input: unknown) {
  const user = await requireSessionUser();
  assertPermission(user.role, "settings:manage");
  const parsed = appearanceSchema.parse(input);

  await db.workspace.update({
    where: { id: user.workspaceId },
    data: {
      name: parsed.name.trim() || NEUTRAL_BRAND.name,
      logoUrl: parsed.logoUrl || null,
      faviconUrl: parsed.faviconUrl || null,
      primaryColor: parsed.primaryColor || NEUTRAL_BRAND.primaryColor,
      secondaryColor: parsed.secondaryColor || null,
      theme: parsed.theme,
      showDeveloperCredit: parsed.showDeveloperCredit ?? false,
    },
  });

  revalidatePath("/settings");
  revalidatePath("/");
}

export async function createSourceAction(input: unknown) {
  const user = await requireSessionUser();
  assertPermission(user.role, "settings:manage");
  const parsed = sourceSchema.parse(input);
  await db.source.create({
    data: {
      workspaceId: user.workspaceId,
      name: parsed.name,
      slug: slugify(parsed.name),
    },
  });
  revalidatePath("/settings");
}

export async function createTagAction(input: unknown) {
  const user = await requireSessionUser();
  assertPermission(user.role, "settings:manage");
  const parsed = tagSchema.parse(input);
  await db.tag.create({
    data: {
      workspaceId: user.workspaceId,
      name: parsed.name,
      color: parsed.color,
    },
  });
  revalidatePath("/settings");
}

export async function createLostReasonAction(input: unknown) {
  const user = await requireSessionUser();
  assertPermission(user.role, "settings:manage");
  const parsed = lostReasonSchema.parse(input);
  await db.lostReason.create({
    data: {
      workspaceId: user.workspaceId,
      name: parsed.name,
    },
  });
  revalidatePath("/settings");
}
