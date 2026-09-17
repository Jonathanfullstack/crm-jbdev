import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getSessionUser } from "@/lib/auth/session";
import { listLeads } from "@/lib/queries/leads";
import { formatCurrency, formatDate } from "@/lib/format";
import { fullName } from "@/lib/utils";

export default async function ClientsPage() {
  const user = await getSessionUser();
  if (!user) return null;
  const clients = await listLeads(user, { kind: "CLIENT" });

  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Leads que fecharam e agora fazem parte da base."
      />
      {clients.length === 0 ? (
        <EmptyState
          title="Nenhum cliente ainda"
          description="Quando um negócio for marcado como fechado, o lead vira cliente automaticamente."
        />
      ) : (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Total vendido</TableHead>
                <TableHead>Última compra</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell>
                    <Link href={`/leads/${client.id}`} className="font-medium hover:underline">
                      {fullName(client.firstName, client.lastName)}
                    </Link>
                  </TableCell>
                  <TableCell>{client.companyName ?? "—"}</TableCell>
                  <TableCell>{client.phone || client.email || "—"}</TableCell>
                  <TableCell>{client.owner?.name ?? "—"}</TableCell>
                  <TableCell className="tabular-nums">{formatCurrency(client.estimatedValue)}</TableCell>
                  <TableCell>{formatDate(client.convertedAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
