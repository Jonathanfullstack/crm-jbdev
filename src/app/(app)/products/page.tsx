import { createProductAction, toggleProductAction } from "@/actions/products";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getSessionUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/format";
import { serializeDecimal } from "@/lib/utils";

export default async function ProductsPage() {
  const user = await getSessionUser();
  if (!user) return null;
  const products = await db.product.findMany({
    where: { workspaceId: user.workspaceId },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader title="Produtos e serviços" description="Catálogo simples para vincular às oportunidades." />
      <Card className="mb-6">
        <CardContent className="pt-6">
          <form
            className="grid gap-3 md:grid-cols-2"
            action={async (formData) => {
              "use server";
              await createProductAction({
                name: String(formData.get("name")),
                description: String(formData.get("description") ?? ""),
                category: String(formData.get("category") ?? ""),
                price: formData.get("price") ? Number(formData.get("price")) : null,
                isActive: true,
              });
            }}
          >
            <Input name="name" placeholder="Nome" required />
            <Input name="category" placeholder="Categoria" />
            <Input name="price" type="number" min="0" step="0.01" placeholder="Preço" />
            <Textarea name="description" placeholder="Descrição" />
            <Button type="submit" className="w-fit">
              Adicionar
            </Button>
          </form>
        </CardContent>
      </Card>
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>{product.category ?? "—"}</TableCell>
                <TableCell>{formatCurrency(serializeDecimal(product.price))}</TableCell>
                <TableCell>
                  <Badge variant={product.isActive ? "success" : "secondary"}>
                    {product.isActive ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <form action={toggleProductAction.bind(null, product.id)}>
                    <Button size="sm" variant="outline" type="submit">
                      {product.isActive ? "Desativar" : "Ativar"}
                    </Button>
                  </form>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
