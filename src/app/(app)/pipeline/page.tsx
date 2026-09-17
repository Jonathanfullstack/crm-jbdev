import { LeadDialog } from "@/components/leads/lead-dialog";
import { KanbanBoard } from "@/components/pipeline/kanban-board";
import { PageHeader } from "@/components/shared/page-header";
import { getSessionUser } from "@/lib/auth/session";
import { canViewAllLeads } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { listLeads } from "@/lib/queries/leads";

export default async function PipelinePage() {
  const user = await getSessionUser();
  if (!user) return null;

  const [stages, leads, lostReasons, sources, tags, users, companies] = await Promise.all([
    db.pipelineStage.findMany({
      where: { workspaceId: user.workspaceId, isHidden: false },
      orderBy: { position: "asc" },
    }),
    listLeads(user),
    db.lostReason.findMany({ where: { workspaceId: user.workspaceId } }),
    db.source.findMany({ where: { workspaceId: user.workspaceId } }),
    db.tag.findMany({ where: { workspaceId: user.workspaceId } }),
    db.user.findMany({
      where: { workspaceId: user.workspaceId, status: "ACTIVE" },
      select: { id: true, name: true },
    }),
    db.company.findMany({
      where: { workspaceId: user.workspaceId },
      select: { id: true, legalName: true },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Funil"
        description="Arraste os cards para acompanhar cada conversa."
        actions={
          <LeadDialog
            sources={sources}
            stages={stages}
            users={users}
            tags={tags}
            companies={companies.map((item) => ({ id: item.id, name: item.legalName }))}
            canAssign={canViewAllLeads(user.role)}
          />
        }
      />
      <KanbanBoard stages={stages} leads={leads} lostReasons={lostReasons} />
    </div>
  );
}
