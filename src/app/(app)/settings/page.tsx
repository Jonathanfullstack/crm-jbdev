import { redirect } from "next/navigation";
import {
  createLostReasonAction,
  createSourceAction,
  createTagAction,
  updateWorkspaceAction,
} from "@/actions/settings";
import { ApiKeysManager } from "@/components/settings/api-keys-manager";
import { AppearanceForm } from "@/components/settings/appearance-form";
import { upsertStageAction, toggleStageVisibilityAction } from "@/actions/pipeline";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Badge } from "@/components/ui/badge";
import { getSessionUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { db } from "@/lib/db";

export default async function SettingsPage() {
  const user = await getSessionUser();
  if (!user) return null;
  if (!hasPermission(user.role, "settings:manage")) redirect("/");

  const [stages, sources, tags, lostReasons, apiKeys] = await Promise.all([
    db.pipelineStage.findMany({
      where: { workspaceId: user.workspaceId },
      orderBy: { position: "asc" },
    }),
    db.source.findMany({ where: { workspaceId: user.workspaceId } }),
    db.tag.findMany({ where: { workspaceId: user.workspaceId } }),
    db.lostReason.findMany({ where: { workspaceId: user.workspaceId } }),
    db.apiKey.findMany({
      where: { workspaceId: user.workspaceId },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, lastUsedAt: true, revokedAt: true, createdAt: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Configurações" description="Personalize o CRM para o processo da sua empresa." />

      <Card>
        <CardHeader>
          <CardTitle>Aparência</CardTitle>
        </CardHeader>
        <CardContent>
          <AppearanceForm
            defaults={{
              name: user.workspace.name,
              logoUrl: user.workspace.logoUrl,
              faviconUrl: user.workspace.faviconUrl,
              primaryColor: user.workspace.primaryColor,
              secondaryColor: user.workspace.secondaryColor,
              theme: user.workspace.theme,
              showDeveloperCredit: user.workspace.showDeveloperCredit,
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Empresa</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-3 md:grid-cols-2"
            action={async (formData) => {
              "use server";
              await updateWorkspaceAction({
                name: user.workspace.name,
                phone: String(formData.get("phone") ?? ""),
                email: String(formData.get("email") ?? ""),
                website: String(formData.get("website") ?? ""),
              });
            }}
          >
            <Input name="phone" defaultValue={user.workspace.phone ?? ""} placeholder="Telefone" />
            <Input name="email" defaultValue={user.workspace.email ?? ""} placeholder="E-mail" />
            <Input name="website" defaultValue={user.workspace.website ?? ""} placeholder="Site" className="md:col-span-2" />
            <Button type="submit" className="w-fit">
              Salvar empresa
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Integrações e API</CardTitle>
        </CardHeader>
        <CardContent>
          <ApiKeysManager
            keys={apiKeys}
            webhookUrl={`${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/webhooks/leads`}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Etapas do funil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {stages.map((stage, index) => (
            <form
              key={stage.id}
              className="grid gap-2 rounded-lg border p-3 md:grid-cols-6"
              action={async (formData) => {
                "use server";
                await upsertStageAction({
                  id: stage.id,
                  name: String(formData.get("name")),
                  color: String(formData.get("color")),
                  kind: String(formData.get("kind")),
                  position: index,
                  isHidden: formData.get("hidden") === "1",
                });
              }}
            >
              <Input name="name" defaultValue={stage.name} />
              <Input name="color" type="color" defaultValue={stage.color} />
              <NativeSelect name="kind" defaultValue={stage.kind}>
                <option value="OPEN">Aberta</option>
                <option value="WON">Ganha</option>
                <option value="LOST">Perdida</option>
              </NativeSelect>
              <Badge variant="secondary">{stage.isHidden ? "Oculta" : "Visível"}</Badge>
              <Button type="submit" variant="outline">
                Salvar
              </Button>
              <Button
                type="submit"
                variant="ghost"
                formAction={async () => {
                  "use server";
                  await toggleStageVisibilityAction(stage.id, !stage.isHidden);
                }}
              >
                {stage.isHidden ? "Mostrar" : "Ocultar"}
              </Button>
            </form>
          ))}
          <form
            className="grid gap-2 md:grid-cols-4"
            action={async (formData) => {
              "use server";
              await upsertStageAction({
                name: String(formData.get("name")),
                color: String(formData.get("color") || "#64748B"),
                kind: String(formData.get("kind") || "OPEN"),
                position: stages.length,
              });
            }}
          >
            <Input name="name" placeholder="Nova etapa" required />
            <Input name="color" type="color" defaultValue="#64748B" />
            <NativeSelect name="kind" defaultValue="OPEN">
              <option value="OPEN">Aberta</option>
              <option value="WON">Ganha</option>
              <option value="LOST">Perdida</option>
            </NativeSelect>
            <Button type="submit">Adicionar etapa</Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        <SimpleList
          title="Origens"
          items={sources.map((item) => item.name)}
          action={async (formData) => {
            "use server";
            await createSourceAction({ name: String(formData.get("name")) });
          }}
        />
        <Card>
          <CardHeader>
            <CardTitle>Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-3 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge key={tag.id} variant="outline" style={{ borderColor: tag.color, color: tag.color }}>
                  {tag.name}
                </Badge>
              ))}
            </div>
            <form
              className="flex gap-2"
              action={async (formData: FormData) => {
                "use server";
                await createTagAction({
                  name: String(formData.get("name")),
                  color: String(formData.get("color") || "#6366F1"),
                });
              }}
            >
              <Input name="name" placeholder="Nova tag" required />
              <Input name="color" type="color" defaultValue="#6366F1" className="w-14 p-1" />
              <Button type="submit">Add</Button>
            </form>
          </CardContent>
        </Card>
        <SimpleList
          title="Motivos de perda"
          items={lostReasons.map((item) => item.name)}
          action={async (formData) => {
            "use server";
            await createLostReasonAction({ name: String(formData.get("name")) });
          }}
        />
      </div>
    </div>
  );
}

function SimpleList({
  title,
  items,
  action,
}: {
  title: string;
  items: string[];
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-3 space-y-1 text-sm">
          {items.map((item) => (
            <p key={item}>{item}</p>
          ))}
        </div>
        <form className="flex gap-2" action={action}>
          <Input name="name" required />
          <Button type="submit">Add</Button>
        </form>
      </CardContent>
    </Card>
  );
}
