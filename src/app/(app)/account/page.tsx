import { PasswordForm } from "@/components/account/password-form";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSessionUser } from "@/lib/auth/session";
import { roleLabel } from "@/lib/labels";

export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) return null;

  return (
    <div className="space-y-6">
      <PageHeader title="Minha conta" description="Dados do seu acesso neste workspace." />
      <Card>
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Nome: </span>
            {user.name}
          </p>
          <p>
            <span className="text-muted-foreground">E-mail: </span>
            {user.email}
          </p>
          <p>
            <span className="text-muted-foreground">Perfil: </span>
            {roleLabel[user.role]}
          </p>
          <p>
            <span className="text-muted-foreground">Empresa: </span>
            {user.workspace.name}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Senha</CardTitle>
        </CardHeader>
        <CardContent>
          <PasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
