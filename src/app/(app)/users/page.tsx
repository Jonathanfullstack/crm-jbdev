import { redirect } from "next/navigation";
import { createUserAction, toggleUserStatusAction } from "@/actions/users";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getSessionUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { db } from "@/lib/db";
import { roleLabel } from "@/lib/labels";

export default async function UsersPage() {
  const user = await getSessionUser();
  if (!user) return null;
  if (!hasPermission(user.role, "users:manage")) redirect("/");

  const users = await db.user.findMany({
    where: { workspaceId: user.workspaceId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <PageHeader title="Usuários" description="Convide a equipe e defina o perfil de acesso." />
      <Card className="mb-6">
        <CardContent className="pt-6">
          <form
            className="grid gap-3 md:grid-cols-5"
            action={async (formData) => {
              "use server";
              await createUserAction({
                name: String(formData.get("name")),
                email: String(formData.get("email")),
                password: String(formData.get("password")),
                role: String(formData.get("role")),
                status: "ACTIVE",
              });
            }}
          >
            <Input name="name" placeholder="Nome" required />
            <Input name="email" type="email" placeholder="E-mail" required />
            <Input name="password" type="password" placeholder="Senha inicial" required />
            <NativeSelect name="role" defaultValue="SELLER">
              <option value="ADMIN">Admin</option>
              <option value="MANAGER">Gestor</option>
              <option value="SELLER">Vendedor</option>
            </NativeSelect>
            <Button type="submit">Convidar</Button>
          </form>
        </CardContent>
      </Card>
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>{item.email}</TableCell>
                <TableCell>{roleLabel[item.role]}</TableCell>
                <TableCell>
                  <Badge variant={item.status === "ACTIVE" ? "success" : "secondary"}>
                    {item.status === "ACTIVE" ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {item.id !== user.id ? (
                    <form action={toggleUserStatusAction.bind(null, item.id)}>
                      <Button size="sm" variant="outline" type="submit">
                        {item.status === "ACTIVE" ? "Desativar" : "Reativar"}
                      </Button>
                    </form>
                  ) : null}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
