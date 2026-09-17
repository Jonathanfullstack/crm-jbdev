import Link from "next/link";
import { notFound } from "next/navigation";
import { completeFollowUpAction } from "@/actions/follow-ups";
import { LeadQuickActions } from "@/components/leads/lead-actions";
import { LeadDialog } from "@/components/leads/lead-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSessionUser } from "@/lib/auth/session";
import { canViewAllLeads } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { getLeadOrThrow } from "@/lib/queries/leads";
import { activityTypeLabel, followUpTypeLabel, proposalStatusLabel } from "@/lib/labels";
import { formatCurrency, formatDateTime, formatPercent } from "@/lib/format";
import { fullName } from "@/lib/utils";

export default async function LeadDetailPage({ params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return null;

  try {
    const lead = await getLeadOrThrow(user, params.id);
    const [stages, sources, tags, users, companies, lostReasons] = await Promise.all([
      db.pipelineStage.findMany({
        where: { workspaceId: user.workspaceId, isHidden: false },
        orderBy: { position: "asc" },
      }),
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
      db.lostReason.findMany({ where: { workspaceId: user.workspaceId } }),
    ]);

    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 rounded-xl border bg-card p-6 shadow-soft lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                {fullName(lead.firstName, lead.lastName)}
              </h1>
              <Badge>{lead.stage.name}</Badge>
              <Badge variant={lead.kind === "CLIENT" ? "success" : "secondary"}>
                {lead.kind === "CLIENT" ? "Cliente" : "Lead"}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {lead.companyName || "Sem empresa"} · {lead.owner?.name ?? "Sem responsável"}
            </p>
            <p className="mt-2 text-lg font-semibold tabular-nums">{formatCurrency(lead.estimatedValue)}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {lead.tags.map((tag) => (
                <Badge key={tag.id} variant="outline" style={{ borderColor: tag.color, color: tag.color }}>
                  {tag.name}
                </Badge>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <LeadQuickActions
              leadId={lead.id}
              phone={lead.phone}
              whatsapp={lead.whatsapp}
              email={lead.email}
              stages={stages}
              currentStageId={lead.stageId}
              lostReasons={lostReasons}
              users={users}
              ownerId={lead.ownerId}
            />
            <LeadDialog
              triggerLabel="Editar cadastro"
              leadId={lead.id}
              defaults={{
                ...lead,
                tagIds: lead.tags.map((tag) => tag.id),
              }}
              sources={sources}
              stages={stages}
              users={users}
              tags={tags}
              companies={companies.map((item) => ({ id: item.id, name: item.legalName }))}
              canAssign={canViewAllLeads(user.role)}
            />
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
          <Card>
            <CardHeader>
              <CardTitle>Linha do tempo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {lead.activities.map((activity) => (
                <div key={activity.id} className="relative border-l pl-4">
                  <span className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full bg-primary" />
                  <p className="text-sm font-medium">{activity.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {activityTypeLabel[activity.type]} · {activity.actor?.name ?? "Sistema"} ·{" "}
                    {formatDateTime(activity.createdAt)}
                  </p>
                  {activity.description ? (
                    <p className="mt-1 text-sm text-muted-foreground">{activity.description}</p>
                  ) : null}
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Dados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <Row label="Telefone" value={lead.phone} />
                <Row label="WhatsApp" value={lead.whatsapp} />
                <Row label="E-mail" value={lead.email} />
                <Row label="Cargo" value={lead.jobTitle} />
                <Row label="Cidade" value={lead.city} />
                <Row label="Origem" value={lead.source?.name} />
                <Row label="Probabilidade" value={formatPercent(lead.probability)} />
                <Row label="Interesse" value={lead.interest} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Follow-ups</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {lead.followUps.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">
                        {followUpTypeLabel[item.type]} · {formatDateTime(item.dueAt)}
                      </p>
                      <p className="text-muted-foreground">{item.description || item.owner.name}</p>
                    </div>
                    {!item.completedAt ? (
                      <form action={completeFollowUpAction.bind(null, item.id)}>
                        <Button size="sm" variant="secondary" type="submit">
                          Concluir
                        </Button>
                      </form>
                    ) : (
                      <Badge variant="success">Feito</Badge>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Propostas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {lead.proposals.map((proposal) => (
                  <div key={proposal.id} className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{proposal.title}</p>
                      <span className="text-muted-foreground">{formatCurrency(proposal.value)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{proposalStatusLabel[proposal.status]}</Badge>
                      <Link href={`/proposals/${proposal.id}`} className="text-xs text-primary hover:underline">
                        Ver
                      </Link>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  } catch {
    notFound();
  }
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span>{value || "—"}</span>
    </div>
  );
}
