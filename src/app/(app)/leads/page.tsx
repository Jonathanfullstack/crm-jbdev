import Link from "next/link";
import { LeadDialog } from "@/components/leads/lead-dialog";
import { LeadImportButton } from "@/components/leads/lead-import";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getSessionUser } from "@/lib/auth/session";
import { canViewAllLeads } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { listLeads } from "@/lib/queries/leads";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { fullName } from "@/lib/utils";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: {
    q?: string;
    ownerId?: string;
    stageId?: string;
    sourceId?: string;
    tagId?: string;
    withoutFollowUp?: string;
    overdue?: string;
    minValue?: string;
    maxValue?: string;
  };
}) {
  const user = await getSessionUser();
  if (!user) return null;

  const [leads, stages, sources, tags, users, companies] = await Promise.all([
    listLeads(user, {
      q: searchParams.q,
      ownerId: searchParams.ownerId,
      stageId: searchParams.stageId,
      sourceId: searchParams.sourceId,
      tagId: searchParams.tagId,
      withoutFollowUp: searchParams.withoutFollowUp === "1",
      overdue: searchParams.overdue === "1",
      minValue: searchParams.minValue ? Number(searchParams.minValue) : undefined,
      maxValue: searchParams.maxValue ? Number(searchParams.maxValue) : undefined,
    }),
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
  ]);

  const options = {
    sources: sources.map((item) => ({ id: item.id, name: item.name })),
    stages: stages.map((item) => ({ id: item.id, name: item.name })),
    users,
    tags: tags.map((item) => ({ id: item.id, name: item.name })),
    companies: companies.map((item) => ({ id: item.id, name: item.legalName })),
  };

  return (
    <div>
      <PageHeader
        title="Leads"
        description="Todas as pessoas que entraram em contato com a empresa."
        actions={
          <>
            <Button asChild variant="outline">
              <a href="/api/export/leads">Exportar CSV</a>
            </Button>
            <LeadImportButton />
            <LeadDialog
              {...options}
              canAssign={canViewAllLeads(user.role)}
            />
          </>
        }
      />

      <form className="mb-4 grid gap-2 rounded-xl border bg-card p-3 md:grid-cols-6">
        <Input name="q" placeholder="Pesquisar" defaultValue={searchParams.q} className="md:col-span-2" />
        <NativeSelect name="ownerId" defaultValue={searchParams.ownerId ?? ""}>
          <option value="">Responsável</option>
          {users.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect name="stageId" defaultValue={searchParams.stageId ?? ""}>
          <option value="">Etapa</option>
          {stages.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect name="sourceId" defaultValue={searchParams.sourceId ?? ""}>
          <option value="">Origem</option>
          {sources.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect name="tagId" defaultValue={searchParams.tagId ?? ""}>
          <option value="">Tag</option>
          {tags.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </NativeSelect>
        <Input name="minValue" type="number" placeholder="Valor mín." defaultValue={searchParams.minValue} />
        <Input name="maxValue" type="number" placeholder="Valor máx." defaultValue={searchParams.maxValue} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="withoutFollowUp" value="1" defaultChecked={searchParams.withoutFollowUp === "1"} />
          Sem follow-up
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="overdue" value="1" defaultChecked={searchParams.overdue === "1"} />
          Atrasados
        </label>
        <button className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground" type="submit">
          Filtrar
        </button>
      </form>

      {leads.length === 0 ? (
        <EmptyState
          title="Nenhum lead encontrado"
          description="Crie o primeiro lead para começar a organizar o funil."
        />
      ) : (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Etapa</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Último contato</TableHead>
                <TableHead>Próximo follow-up</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell>
                    <Link href={`/leads/${lead.id}`} className="font-medium hover:underline">
                      {fullName(lead.firstName, lead.lastName)}
                    </Link>
                  </TableCell>
                  <TableCell>{lead.companyName ?? "—"}</TableCell>
                  <TableCell>{lead.phone ?? "—"}</TableCell>
                  <TableCell>{lead.email ?? "—"}</TableCell>
                  <TableCell>{lead.source?.name ?? "—"}</TableCell>
                  <TableCell>{lead.owner?.name ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{lead.stage.name}</Badge>
                  </TableCell>
                  <TableCell className="tabular-nums">{formatCurrency(lead.estimatedValue)}</TableCell>
                  <TableCell>{formatDateTime(lead.lastContactAt)}</TableCell>
                  <TableCell>{formatDateTime(lead.nextFollowUpAt)}</TableCell>
                  <TableCell>
                    <Badge variant={lead.kind === "CLIENT" ? "success" : "outline"}>
                      {lead.kind === "CLIENT" ? "Cliente" : "Lead"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
