import { StageKind } from "@prisma/client";
import { db } from "@/lib/db";
import type { SessionUser } from "@/lib/auth/session";
import { assertPermission } from "@/lib/auth/permissions";
import { leadVisibilityWhere } from "@/lib/scope";
import { serializeDecimal } from "@/lib/utils";

export async function getReportsData(
  user: SessionUser,
  range: { from: Date; to: Date },
) {
  assertPermission(user.role, "reports:read");
  const visibility = leadVisibilityWhere(user);
  const createdInRange = {
    ...visibility,
    createdAt: { gte: range.from, lte: range.to },
  };

  const [received, sources, owners, lost, wonLeads, openLeads] = await Promise.all([
    db.lead.count({ where: createdInRange }),
    db.source.findMany({
      where: { workspaceId: user.workspaceId },
      include: { _count: { select: { leads: { where: createdInRange } } } },
    }),
    db.user.findMany({
      where: { workspaceId: user.workspaceId, status: "ACTIVE" },
      select: {
        id: true,
        name: true,
        ownedLeads: {
          where: {
            ...visibility,
            stage: { kind: StageKind.WON },
            convertedAt: { gte: range.from, lte: range.to },
          },
          select: { estimatedValue: true },
        },
      },
    }),
    db.lostReason.findMany({
      where: { workspaceId: user.workspaceId },
      include: {
        _count: {
          select: {
            leads: {
              where: {
                ...visibility,
                updatedAt: { gte: range.from, lte: range.to },
                stage: { kind: StageKind.LOST },
              },
            },
          },
        },
      },
    }),
    db.lead.findMany({
      where: {
        ...visibility,
        stage: { kind: StageKind.WON },
        convertedAt: { gte: range.from, lte: range.to },
      },
      select: { createdAt: true, convertedAt: true, estimatedValue: true },
    }),
    db.pipelineStage.findMany({
      where: { workspaceId: user.workspaceId, isHidden: false },
      orderBy: { position: "asc" },
      include: {
        _count: { select: { leads: { where: visibility } } },
      },
    }),
  ]);

  const soldValue = wonLeads.reduce(
    (sum, lead) => sum + (serializeDecimal(lead.estimatedValue) ?? 0),
    0,
  );
  const conversion = received > 0 ? (wonLeads.length / received) * 100 : 0;
  const avgCloseDays =
    wonLeads.length === 0
      ? 0
      : wonLeads.reduce((sum, lead) => {
          if (!lead.convertedAt) return sum;
          const diff =
            (lead.convertedAt.getTime() - lead.createdAt.getTime()) /
            (1000 * 60 * 60 * 24);
          return sum + diff;
        }, 0) / wonLeads.length;

  return {
    received,
    conversion,
    soldValue,
    lostCount: lost.reduce((sum, item) => sum + item._count.leads, 0),
    avgCloseDays,
    sources: sources.map((source) => ({ name: source.name, count: source._count.leads })),
    owners: owners.map((owner) => ({
      name: owner.name,
      count: owner.ownedLeads.length,
      value: owner.ownedLeads.reduce(
        (sum, lead) => sum + (serializeDecimal(lead.estimatedValue) ?? 0),
        0,
      ),
    })),
    lostReasons: lost.map((reason) => ({
      name: reason.name,
      count: reason._count.leads,
    })),
    funnel: openLeads.map((stage) => ({
      name: stage.name,
      color: stage.color,
      count: stage._count.leads,
    })),
  };
}
