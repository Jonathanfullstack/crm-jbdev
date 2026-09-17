import Link from "next/link";
import { updateProposalStatusAction } from "@/actions/proposals";
import { ProposalForm } from "@/components/proposals/proposal-form";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getSessionUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { proposalStatusLabel } from "@/lib/labels";
import { formatCurrency, formatDate } from "@/lib/format";
import { serializeDecimal, fullName } from "@/lib/utils";
import { leadVisibilityWhere } from "@/lib/scope";

const statuses = ["DRAFT", "SENT", "VIEWED", "ACCEPTED", "REJECTED"] as const;

export default async function ProposalsPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const [proposals, leads, opportunities] = await Promise.all([
    db.proposal.findMany({
      where: { workspaceId: user.workspaceId, lead: leadVisibilityWhere(user) },
      include: { lead: true, opportunity: true },
      orderBy: { createdAt: "desc" },
    }),
    db.lead.findMany({
      where: leadVisibilityWhere(user),
      select: { id: true, firstName: true, lastName: true },
      orderBy: { firstName: "asc" },
    }),
    db.opportunity.findMany({
      where: { workspaceId: user.workspaceId, lead: leadVisibilityWhere(user) },
      select: { id: true, title: true, leadId: true },
    }),
  ]);

  return (
    <div>
      <PageHeader
        title="Propostas"
        description="Monte, envie e acompanhe o status comercial até o aceite."
      />
      <Card className="mb-6">
        <CardContent className="pt-6">
          <ProposalForm leads={leads} opportunities={opportunities} />
        </CardContent>
      </Card>
      {proposals.length === 0 ? (
        <EmptyState
          title="Nenhuma proposta ainda"
          description="Crie a primeira proposta para um lead em andamento."
        />
      ) : (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {proposals.map((proposal) => (
                <TableRow key={proposal.id}>
                  <TableCell className="font-medium">{proposal.title}</TableCell>
                  <TableCell>
                    <Link href={`/leads/${proposal.leadId}`} className="hover:underline">
                      {fullName(proposal.lead.firstName, proposal.lead.lastName)}
                    </Link>
                  </TableCell>
                  <TableCell className="tabular-nums">{formatCurrency(serializeDecimal(proposal.value))}</TableCell>
                  <TableCell>{formatDate(proposal.validUntil)}</TableCell>
                  <TableCell>
                    <form
                      className="flex items-center gap-2"
                      action={async (formData) => {
                        "use server";
                        await updateProposalStatusAction({
                          id: proposal.id,
                          status: String(formData.get("status")),
                        });
                      }}
                    >
                      <NativeSelect name="status" defaultValue={proposal.status} className="h-8 w-36">
                        {statuses.map((status) => (
                          <option key={status} value={status}>
                            {proposalStatusLabel[status]}
                          </option>
                        ))}
                      </NativeSelect>
                      <Button size="sm" variant="outline" type="submit">
                        Atualizar
                      </Button>
                    </form>
                  </TableCell>
                  <TableCell>
                    <Button asChild size="sm" variant="secondary">
                      <Link href={`/proposals/${proposal.id}`}>Ver documento</Link>
                    </Button>
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
