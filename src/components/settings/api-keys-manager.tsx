"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createApiKeyAction, revokeApiKeyAction } from "@/actions/api-keys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDateTime } from "@/lib/format";

type ApiKeyItem = {
  id: string;
  name: string;
  lastUsedAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
};

export function ApiKeysManager({
  keys,
  webhookUrl,
}: {
  keys: ApiKeyItem[];
  webhookUrl: string;
}) {
  const [token, setToken] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Use a chave para enviar leads de um site, formulário, n8n ou Zapier para{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">{webhookUrl}</code>
      </p>
      <form
        className="flex max-w-lg gap-2"
        action={async (formData) => {
          setPending(true);
          try {
            const result = await createApiKeyAction({ name: String(formData.get("name") ?? "") });
            setToken(result.token);
            toast.success("Chave criada. Copie agora; ela não aparece de novo.");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Não foi possível criar a chave.");
          } finally {
            setPending(false);
          }
        }}
      >
        <Input name="name" placeholder="Nome da integração" required />
        <Button type="submit" disabled={pending}>
          Gerar chave
        </Button>
      </form>
      {token ? (
        <div className="rounded-lg border bg-muted/40 p-3 text-sm">
          <p className="mb-1 font-medium">Chave gerada</p>
          <code className="break-all text-xs">{token}</code>
        </div>
      ) : null}
      <div className="space-y-2">
        {keys.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma chave ainda.</p>
        ) : (
          keys.map((key) => (
            <div key={key.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
              <div>
                <p className="font-medium">{key.name}</p>
                <p className="text-xs text-muted-foreground">
                  Criada em {formatDateTime(key.createdAt)}
                  {key.lastUsedAt ? ` · último uso ${formatDateTime(key.lastUsedAt)}` : ""}
                  {key.revokedAt ? " · revogada" : ""}
                </p>
              </div>
              {!key.revokedAt ? (
                <form action={revokeApiKeyAction.bind(null, key.id)}>
                  <Button type="submit" size="sm" variant="outline">
                    Revogar
                  </Button>
                </form>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
