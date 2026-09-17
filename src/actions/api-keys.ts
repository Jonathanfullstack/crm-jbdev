"use server";

import { createHash, randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSessionUser } from "@/lib/auth/session";
import { assertPermission } from "@/lib/auth/permissions";
import { apiKeySchema } from "@/lib/validations/api-key";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createApiKeyAction(input: unknown) {
  const user = await requireSessionUser();
  assertPermission(user.role, "settings:manage");
  const parsed = apiKeySchema.parse(input);
  const token = `crm_${randomBytes(24).toString("hex")}`;

  const apiKey = await db.apiKey.create({
    data: {
      workspaceId: user.workspaceId,
      name: parsed.name.trim(),
      tokenHash: hashToken(token),
      createdById: user.id,
    },
  });

  revalidatePath("/settings");
  return { id: apiKey.id, token };
}

export async function revokeApiKeyAction(apiKeyId: string) {
  const user = await requireSessionUser();
  assertPermission(user.role, "settings:manage");

  await db.apiKey.updateMany({
    where: { id: apiKeyId, workspaceId: user.workspaceId, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  revalidatePath("/settings");
}
