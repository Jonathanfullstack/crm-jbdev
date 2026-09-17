import { StageKind } from "@prisma/client";
import { db } from "@/lib/db";
import type { SessionUser } from "@/lib/auth/session";
import { leadVisibilityWhere } from "@/lib/scope";
import { serializeDecimal } from "@/lib/utils";

export async function getDashboardData(
  user: SessionUser,
  range: { from: Date; to: Date },
) {
  const visibility = leadVisibilityWhere(user);
  const createdInRange = {
    ...visibility,
    createdAt: { gte: range.from, lte: range.to },
  };

  const stages = await db.pipelineStage.findMany({
    where: { workspaceId: user.workspaceId },
    orderBy: { position: "asc" },
  });

  const wonStageIds = stages.filter((s) => s.kind === StageKind.WON).map((s) => s.id);
  const lostStageIds = stages.filter((s) => s.kind === StageKind.LOST).map((s) => s.id);
  const proposalStageIds = stages
    .filter((s) => /proposta/i.test(s.name))
    .map((s) => s.id);
  const negotiationStageIds = stages
    .filter((s) => /negocia/i.test(s.name))
    .map((s) => s.id);
  const attendingStageIds = stages
    .filter((s) => /atendimento|contato|qualific/i.test(s.name))
    .map((s) => s.id);
  const newStageIds = stages.filter((s) => /novo/i.test(s.name)).map((s) => s.id);

  const [
    newLeads,
    attending,
    proposals,
    negotiations,
    won,
    lost,
    pipelineValue,
    closedRevenue,
    monthLeads,
    wonLeads,
    pendingTasks,
    overdueFollowUps,
    sources,
    leadsInRange,
    wonInRange,
  ] = await Promise.all([
    db.lead.count({ where: { ...visibility, stageId: { in: newStageIds } } }),
    db.lead.count({ where: { ...visibility, stageId: { in: attendingStageIds } } }),
    db.lead.count({ where: { ...visibility, stageId: { in: proposalStageIds } } }),
    db.lead.count({ where: { ...visibility, stageId: { in: negotiationStageIds } } }),
    db.lead.count({ where: { ...visibility, stageId: { in: wonStageIds } } }),
    db.lead.count({ where: { ...visibility, stageId: { in: lostStageIds } } }),
    db.lead.aggregate({
      where: {
        ...visibility,
        stage: { kind: StageKind.OPEN },
      },
      _sum: { estimatedValue: true },
    }),
    db.lead.aggregate({
      where: {
        ...visibility,
        stage: { kind: StageKind.WON },
        convertedAt: { gte: range.from, lte: range.to },
      },
      _sum: { estimatedValue: true },
    }),
    db.lead.count({ where: createdInRange }),
    db.lead.count({
      where: {
        ...visibility,
        kind: "CLIENT",
        convertedAt: { gte: range.from, lte: range.to },
      },
    }),
    db.task.count({
      where: {
        workspaceId: user.workspaceId,
        status: { not: "DONE" },
        ...(user.role === "SELLER" ? { ownerId: user.id } : {}),
      },
    }),
    db.followUp.count({
      where: {
        workspaceId: user.workspaceId,
        completedAt: null,
        dueAt: { lt: new Date() },
        ...(user.role === "SELLER" ? { ownerId: user.id } : {}),
      },
    }),
    db.source.findMany({
      where: { workspaceId: user.workspaceId },
      include: {
        _count: {
          select: { leads: { where: createdInRange } },
        },
      },
    }),
    db.lead.findMany({
      where: createdInRange,
      select: { createdAt: true },
    }),
    db.lead.findMany({
      where: {
        ...visibility,
        stage: { kind: StageKind.WON },
        convertedAt: { gte: range.from, lte: range.to },
      },
      select: { convertedAt: true, estimatedValue: true },
    }),
  ]);

  const closedValue = serializeDecimal(closedRevenue._sum.estimatedValue) ?? 0;
  const conversion = monthLeads > 0 ? (wonLeads / monthLeads) * 100 : 0;
  const ticket = wonLeads > 0 ? closedValue / wonLeads : 0;

  return {
    cards: {
      newLeads,
      attending,
      proposals,
      negotiations,
      won,
      lost,
      pipelineValue: serializeDecimal(pipelineValue._sum.estimatedValue) ?? 0,
      closedRevenue: closedValue,
    },
    kpis: {
      conversion,
      ticket,
      monthLeads,
      wonLeads,
      pendingTasks,
      overdueFollowUps,
    },
    sources: sources.map((source) => ({
      name: source.name,
      count: source._count.leads,
    })),
    leadsByDay: groupByDay(leadsInRange.map((lead) => lead.createdAt)),
    salesByDay: groupByDay(
      wonInRange
        .filter((lead) => lead.convertedAt)
        .map((lead) => lead.convertedAt as Date),
      wonInRange.map((lead) => serializeDecimal(lead.estimatedValue) ?? 0),
    ),
  };
}

function groupByDay(dates: Date[], values?: number[]) {
  const map = new Map<string, number>();
  dates.forEach((date, index) => {
    const key = date.toISOString().slice(0, 10);
    const increment = values?.[index] ?? 1;
    map.set(key, (map.get(key) ?? 0) + increment);
  });
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({ date, value }));
}
