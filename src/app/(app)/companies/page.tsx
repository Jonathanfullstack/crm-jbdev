import { createCompanyAction } from "@/actions/companies";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getSessionUser } from "@/lib/auth/session";
import { db } from "@/lib/db";

export default async function CompaniesPage() {
  const user = await getSessionUser();
  if (!user) return null;
  const companies = await db.company.findMany({
    where: { workspaceId: user.workspaceId },
    include: { _count: { select: { leads: true } } },
    orderBy: { legalName: "asc" },
  });

  return (
    <div>
      <PageHeader title="Empresas" description="Cadastro B2B para relacionar vários contatos à mesma empresa." />
      <Card className="mb-6">
        <CardContent className="pt-6">
          <form
            className="grid gap-3 md:grid-cols-3"
            action={async (formData) => {
              "use server";
              await createCompanyAction({
                legalName: String(formData.get("legalName")),
                tradeName: String(formData.get("tradeName") ?? ""),
                document: String(formData.get("document") ?? ""),
                phone: String(formData.get("phone") ?? ""),
                email: String(formData.get("email") ?? ""),
                website: String(formData.get("website") ?? ""),
                segment: String(formData.get("segment") ?? ""),
                city: String(formData.get("city") ?? ""),
                state: String(formData.get("state") ?? ""),
              });
            }}
          >
            <Input name="legalName" placeholder="Razão social" required />
            <Input name="tradeName" placeholder="Nome fantasia" />
            <Input name="document" placeholder="CNPJ (opcional)" />
            <Input name="phone" placeholder="Telefone" />
            <Input name="email" placeholder="E-mail" />
            <Input name="website" placeholder="Site" />
            <Input name="segment" placeholder="Segmento" />
            <Input name="city" placeholder="Cidade" />
            <Input name="state" placeholder="Estado" />
            <Button type="submit" className="md:col-span-3 w-fit">
              Cadastrar empresa
            </Button>
          </form>
        </CardContent>
      </Card>
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Razão social</TableHead>
              <TableHead>Fantasia</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>Cidade</TableHead>
              <TableHead>Contatos</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {companies.map((company) => (
              <TableRow key={company.id}>
                <TableCell className="font-medium">{company.legalName}</TableCell>
                <TableCell>{company.tradeName ?? "—"}</TableCell>
                <TableCell>{company.document ?? "—"}</TableCell>
                <TableCell>
                  {[company.city, company.state].filter(Boolean).join("/") || "—"}
                </TableCell>
                <TableCell>{company._count.leads}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
