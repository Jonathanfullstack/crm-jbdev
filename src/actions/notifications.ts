"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSessionUser } from "@/lib/auth/session";

export async function markNotificationReadAction(notificationId: string) {
  const user = await requireSessionUser();
  await db.notification.updateMany({
    where: { id: notificationId, userId: user.id, workspaceId: user.workspaceId },
    data: { readAt: new Date() },
  });
  revalidatePath("/");
}

export async function markAllNotificationsReadAction() {
  const user = await requireSessionUser();
  await db.notification.updateMany({
    where: { userId: user.id, workspaceId: user.workspaceId, readAt: null },
    data: { readAt: new Date() },
  });
  revalidatePath("/");
}
