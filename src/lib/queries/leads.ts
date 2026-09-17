import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { SessionUser } from "@/lib/auth/session";
import { leadVisibilityWhere } from "@/lib/scope";
import { serializeDecimal } from "@/lib/utils";

export const leadInclude = {
  stage: true,
  owner: { select: { id: true, name: true, email: true, role: true } },
  source: true,
  company: true,
  lostReason: true,
  tags: { include: { tag: true } },
} satisfies Prisma.LeadInclude;

export type LeadFilters = {
  q?: string;
  ownerId?: string;
  stageId?: string;
  sourceId?: string;
  tagId?: string;
  kind?: "LEAD" | "CLIENT";
  withoutFollowUp?: boolean;
  overdue?: boolean;
  minValue?: number;
  maxValue?: number;
  from?: Date;
  to?: Date;
};

export async function listLeads(user: SessionUser, filters: LeadFilters = {}) {
  const where: Prisma.LeadWhereInput = {
    ...leadVisibilityWhere(user),
  };

  if (filters.kind) where.kind = filters.kind;
  if (filters.ownerId) where.ownerId = filters.ownerId;
  if (filters.stageId) where.stageId = filters.stageId;
  if (filters.sourceId) where.sourceId = filters.sourceId;
  if (filters.tagId) where.tags = { some: { tagId: filters.tagId } };
  if (filters.withoutFollowUp) where.nextFollowUpAt = null;
  if (filters.overdue) {
    where.nextFollowUpAt = { lt: new Date() };
  }
  if (filters.from || filters.to) {
    where.createdAt = {
      gte: filters.from,
      lte: filters.to,
    };
  }
  if (filters.minValue !== undefined || filters.maxValue !== undefined) {
    where.estimatedValue = {
      gte: filters.minValue,
      lte: filters.maxValue,
    };
  }
  if (filters.q) {
    where.OR = [
      { firstName: { contains: filters.q, mode: "insensitive" } },
      { lastName: { contains: filters.q, mode: "insensitive" } },
      { companyName: { contains: filters.q, mode: "insensitive" } },
      { email: { contains: filters.q, mode: "insensitive" } },
      { phone: { contains: filters.q, mode: "insensitive" } },
      { whatsapp: { contains: filters.q, mode: "insensitive" } },
    ];
  }

  const leads = await db.lead.findMany({
    where,
    include: leadInclude,
    orderBy: { updatedAt: "desc" },
  });

  return leads.map(serializeLead);
}

export async function getLeadOrThrow(user: SessionUser, leadId: string) {
  const lead = await db.lead.findFirst({
    where: { id: leadId, ...leadVisibilityWhere(user) },
    include: {
      ...leadInclude,
      followUps: { orderBy: { dueAt: "desc" }, take: 8, include: { owner: true } },
      tasks: { orderBy: { createdAt: "desc" }, take: 8, include: { owner: true } },
      notesList: { orderBy: { createdAt: "desc" }, take: 12, include: { author: true } },
      activities: { orderBy: { createdAt: "desc" }, take: 40, include: { actor: true } },
      proposals: { orderBy: { createdAt: "desc" } },
      opportunities: { include: { product: true, stage: true } },
    },
  });

  if (!lead) {
    throw new Error("Lead não encontrado.");
  }

  return {
    ...serializeLead(lead),
    followUps: lead.followUps,
    tasks: lead.tasks,
    notesList: lead.notesList,
    activities: lead.activities,
    proposals: lead.proposals.map((proposal) => ({
      ...proposal,
      value: serializeDecimal(proposal.value) ?? 0,
    })),
    opportunities: lead.opportunities.map((opportunity) => ({
      ...opportunity,
      value: serializeDecimal(opportunity.value),
    })),
  };
}

export function serializeLead<
  T extends {
    estimatedValue: unknown;
    tags?: { tag: { id: string; name: string; color: string } }[];
  },
>(lead: T) {
  const { estimatedValue, tags, ...rest } = lead;
  return {
    ...rest,
    estimatedValue: serializeDecimal(estimatedValue),
    tags: tags?.map((item) => item.tag) ?? [],
  };
}
