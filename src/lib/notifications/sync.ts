import { startOfDay } from "date-fns";
import { db } from "@/lib/db";
import type { SessionUser } from "@/lib/auth/session";
import { fullName } from "@/lib/utils";

export async function syncDueReminders(user: SessionUser) {
  const now = new Date();
  const dayStart = startOfDay(now);
  const ownerFilter = user.role === "SELLER" ? { ownerId: user.id } : {};

  const [followUps, tasks, existing] = await Promise.all([
    db.followUp.findMany({
      where: {
        workspaceId: user.workspaceId,
        completedAt: null,
        dueAt: { lt: now },
        ...ownerFilter,
      },
      include: { lead: { select: { firstName: true, lastName: true } } },
      take: 12,
      orderBy: { dueAt: "asc" },
    }),
    db.task.findMany({
      where: {
        workspaceId: user.workspaceId,
        status: { not: "DONE" },
        dueAt: { lt: now, not: null },
        ...ownerFilter,
      },
      take: 12,
      orderBy: { dueAt: "asc" },
    }),
    db.notification.findMany({
      where: {
        workspaceId: user.workspaceId,
        userId: user.id,
        type: { in: ["FOLLOW_UP_OVERDUE", "TASK_DUE"] },
        createdAt: { gte: dayStart },
      },
      select: { type: true, link: true },
    }),
  ]);

  const seen = new Set(existing.map((item) => `${item.type}:${item.link ?? ""}`));
  const payload = [
    ...followUps.map((item) => {
      const link = `/leads/${item.leadId}`;
      return {
        key: `FOLLOW_UP_OVERDUE:${link}`,
        workspaceId: user.workspaceId,
        userId: user.id,
        type: "FOLLOW_UP_OVERDUE" as const,
        title: "Follow-up atrasado",
        body: `${fullName(item.lead.firstName, item.lead.lastName)} precisa de retorno.`,
        link,
      };
    }),
    ...tasks.map((item) => {
      const link = item.leadId ? `/leads/${item.leadId}?task=${item.id}` : `/tasks?id=${item.id}`;
      return {
        key: `TASK_DUE:${link}`,
        workspaceId: user.workspaceId,
        userId: user.id,
        type: "TASK_DUE" as const,
        title: "Tarefa atrasada",
        body: item.title,
        link,
      };
    }),
  ].filter((item) => !seen.has(item.key));

  if (payload.length === 0) return;

  await db.notification.createMany({
    data: payload.map(({ key: _key, ...item }) => item),
  });
}
