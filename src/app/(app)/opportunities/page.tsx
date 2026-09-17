import Link from "next/link";
import { createOpportunityAction, updateOpportunityStatusAction } from "@/actions/opportunities";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getSessionUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import { serializeDecimal, fullName } from "@/lib/utils";

export default async function OpportunitiesPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const [opportunities, leads, products, stages, users, lostReasons] = await Promise.all([
    db.opportunity.findMany({
      where: { workspaceId: user.workspaceId },
      include: { lead: true, product: true, stage: true, owner: true },
      orderBy: { updatedAt: "desc" },
    }),
    db.lead.findMany({
      where: { workspaceId: user.workspaceId },
      select: { id: true, firstName: true, lastName: true },
    }),
    db.product.findMany({ where: { workspaceId: user.workspaceId, isActive: true } }),
    db.pipelineStage.findMany({
      where: { workspaceId: user.workspaceId, isHidden: false },
      orderBy: { position: "asc" },
    }),
    db.user.findMany({
      where: { workspaceId: user.workspaceId, status: "ACTIVE" },
      select: { id: true, name: true },
    }),
    db.lostReason.findMany({ where: { workspaceId: user.workspaceId } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Oportunidades"
        description="Um cliente pode ter vários negócios em andamento."
      />
      <Card className="mb-6">
        <CardContent className="pt-6">
          <form
            className="grid gap-3 md:grid-cols-3"
            action={async (formData) => {
              "use server";
              await createOpportunityAction({
                title: String(formData.get("title")),
                leadId: String(formData.get("leadId")),
                productId: String(formData.get("productId") || "") || null,
                value: formData.get("value") ? Number(formData.get("value")) : null,
                stageId: String(formData.get("stageId") || "") || null,
                probability: formData.get("probability") ? Number(formData.get("probability")) : null,
                ownerId: String(formData.get("ownerId") || "") || null,
                expectedClose: String(formData.get("expectedClose") || "") || null,
              });
            }}
          >
            <Input name="title" placeholder="Título da oportunidade" required />
            <NativeSelect name="leadId" required>
              <option value="">Cliente</option>
              {leads.map((lead) => (
                <option key={lead.id} value={lead.id}>
                  {fullName(lead.firstName, lead.lastName)}
                </option>
              ))}
            </NativeSelect>
            <NativeSelect name="productId">
              <option value="">Produto/serviço</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </NativeSelect>
            <Input name="value" type="number" min="0" step="0.01" placeholder="Valor" />
            <NativeSelect name="stageId">
              <option value="">Etapa</option>
              {stages.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.name}
                </option>
              ))}
            </NativeSelect>
            <Input name="probability" type="number" min="0" max="100" placeholder="Probabilidade" />
            <NativeSelect name="ownerId" defaultValue={user.id}>
              {users.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </NativeSelect>
            <Input name="expectedClose" type="date" />
            <Button type="submit">Criar oportunidade</Button>
          </form>
        </CardContent>
      </Card>
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Etapa</TableHead>
              <TableHead>Probabilidade</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Previsão</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {opportunities.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.title}</TableCell>
                <TableCell>
                  <Link href={`/leads/${item.leadId}`} className="hover:underline">
                    {fullName(item.lead.firstName, item.lead.lastName)}
                  </Link>
                </TableCell>
                <TableCell>{item.product?.name ?? "—"}</TableCell>
                <TableCell className="tabular-nums">{formatCurrency(serializeDecimal(item.value))}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{item.stage.name}</Badge>
                </TableCell>
                <TableCell>{formatPercent(item.probability)}</TableCell>
                <TableCell>{item.owner?.name ?? "—"}</TableCell>
                <TableCell>{formatDate(item.expectedClose)}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant={
                        item.status === "WON" ? "success" : item.status === "LOST" ? "danger" : "secondary"
                      }
                    >
                      {item.status === "WON" ? "Ganha" : item.status === "LOST" ? "Perdida" : "Aberta"}
                    </Badge>
                    {item.status === "OPEN" ? (
                      <>
                        <form
                          action={async () => {
                            "use server";
                            await updateOpportunityStatusAction({ id: item.id, status: "WON" });
                          }}
                        >
                          <Button size="sm" variant="secondary" type="submit">
                            Ganhar
                          </Button>
                        </form>
                        <form
                          action={async (formData) => {
                            "use server";
                            await updateOpportunityStatusAction({
                              id: item.id,
                              status: "LOST",
                              lostReasonId: String(formData.get("lostReasonId") || "") || null,
                            });
                          }}
                          className="flex items-center gap-2"
                        >
                          <NativeSelect name="lostReasonId" className="h-8 w-36" required>
                            <option value="">Motivo</option>
                            {lostReasons.map((reason) => (
                              <option key={reason.id} value={reason.id}>
                                {reason.name}
                              </option>
                            ))}
                          </NativeSelect>
                          <Button size="sm" variant="outline" type="submit">
                            Perder
                          </Button>
                        </form>
                      </>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
