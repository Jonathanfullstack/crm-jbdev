export type DomainEventName =
  | "lead.created"
  | "lead.stage_changed"
  | "lead.won"
  | "lead.lost"
  | "lead.assigned"
  | "lead.value_changed"
  | "followup.created"
  | "followup.completed"
  | "task.created"
  | "task.completed"
  | "note.created"
  | "proposal.created"
  | "proposal.status_changed";

export type DomainEvent = {
  name: DomainEventName;
  workspaceId: string;
  actorId?: string | null;
  leadId?: string | null;
  opportunityId?: string | null;
  title: string;
  description?: string | null;
  metadata?: Record<string, unknown>;
};
