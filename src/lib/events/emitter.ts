import type { ActivityType, NotificationType } from "@prisma/client";
import { db } from "@/lib/db";
import type { DomainEvent, DomainEventName } from "@/lib/events/types";

const ACTIVITY_MAP: Partial<Record<DomainEventName, ActivityType>> = {
  "lead.created": "LEAD_CREATED",
  "lead.stage_changed": "STAGE_CHANGED",
  "lead.won": "STAGE_CHANGED",
  "lead.lost": "STAGE_CHANGED",
  "lead.assigned": "OWNER_CHANGED",
  "lead.value_changed": "VALUE_CHANGED",
  "followup.created": "FOLLOW_UP",
  "followup.completed": "FOLLOW_UP",
  "task.created": "TASK",
  "task.completed": "TASK",
  "note.created": "NOTE",
  "proposal.created": "PROPOSAL",
  "proposal.status_changed": "PROPOSAL",
};

export async function emitEvent(event: DomainEvent) {
  const activityType = ACTIVITY_MAP[event.name];

  if (activityType) {
    await db.activity.create({
      data: {
        workspaceId: event.workspaceId,
        leadId: event.leadId ?? undefined,
        opportunityId: event.opportunityId ?? undefined,
        actorId: event.actorId ?? undefined,
        type: activityType,
        title: event.title,
        description: event.description ?? undefined,
        metadata: {
          event: event.name,
          ...(event.metadata ?? {}),
        },
      },
    });
  }

  await maybeNotify(event);

  // Future: enqueue webhook / e-mail / WhatsApp delivery here.
}

async function maybeNotify(event: DomainEvent) {
  if (!event.leadId) return;

  const lead = await db.lead.findFirst({
    where: { id: event.leadId, workspaceId: event.workspaceId },
    select: { ownerId: true, firstName: true, lastName: true },
  });

  if (!lead?.ownerId) return;

  const payload = notificationFor(event, `${lead.firstName} ${lead.lastName ?? ""}`.trim());
  if (!payload) return;

  await db.notification.create({
    data: {
      workspaceId: event.workspaceId,
      userId: lead.ownerId,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      link: payload.link,
    },
  });
}

function notificationFor(
  event: DomainEvent,
  leadName: string,
): { type: NotificationType; title: string; body: string; link: string } | null {
  switch (event.name) {
    case "lead.created":
      return {
        type: "NEW_LEAD",
        title: "Novo lead recebido",
        body: `${leadName} entrou no funil.`,
        link: `/leads/${event.leadId}`,
      };
    case "lead.assigned":
      return {
        type: "LEAD_ASSIGNED",
        title: "Lead atribuído a você",
        body: `${leadName} agora está sob sua responsabilidade.`,
        link: `/leads/${event.leadId}`,
      };
    case "proposal.created":
      return {
        type: "PROPOSAL_WAITING",
        title: "Proposta registrada",
        body: `Uma proposta foi adicionada para ${leadName}.`,
        link: `/leads/${event.leadId}`,
      };
    default:
      return null;
  }
}
