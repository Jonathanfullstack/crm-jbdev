"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createLeadAction, updateLeadAction } from "@/actions/leads";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";

type Option = { id: string; name: string };

export type LeadFormValues = {
  firstName: string;
  lastName?: string | null;
  companyName?: string | null;
  companyId?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  jobTitle?: string | null;
  city?: string | null;
  state?: string | null;
  sourceId?: string | null;
  stageId?: string | null;
  ownerId?: string | null;
  estimatedValue?: number | null;
  probability?: number | null;
  interest?: string | null;
  notes?: string | null;
  tagIds?: string[];
};

export function LeadForm({
  leadId,
  defaults,
  sources,
  stages,
  users,
  tags,
  companies,
  canAssign,
  onSuccess,
}: {
  leadId?: string;
  defaults?: Partial<LeadFormValues>;
  sources: Option[];
  stages: Option[];
  users: Option[];
  tags: Option[];
  companies: Option[];
  canAssign: boolean;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [tagIds, setTagIds] = useState<string[]>(defaults?.tagIds ?? []);

  async function onSubmit(formData: FormData) {
    setPending(true);
    const payload = {
      firstName: String(formData.get("firstName") ?? ""),
      lastName: String(formData.get("lastName") ?? ""),
      companyName: String(formData.get("companyName") ?? ""),
      companyId: String(formData.get("companyId") ?? "") || null,
      phone: String(formData.get("phone") ?? ""),
      whatsapp: String(formData.get("whatsapp") ?? ""),
      email: String(formData.get("email") ?? ""),
      jobTitle: String(formData.get("jobTitle") ?? ""),
      city: String(formData.get("city") ?? ""),
      state: String(formData.get("state") ?? ""),
      sourceId: String(formData.get("sourceId") ?? "") || null,
      stageId: String(formData.get("stageId") ?? "") || null,
      ownerId: String(formData.get("ownerId") ?? "") || null,
      estimatedValue: formData.get("estimatedValue")
        ? Number(formData.get("estimatedValue"))
        : null,
      probability: formData.get("probability") ? Number(formData.get("probability")) : null,
      interest: String(formData.get("interest") ?? ""),
      notes: String(formData.get("notes") ?? ""),
      tagIds,
    };

    try {
      if (leadId) {
        await updateLeadAction(leadId, payload);
        toast.success("Lead atualizado");
        onSuccess?.();
        router.refresh();
      } else {
        const created = await createLeadAction(payload);
        toast.success("Lead criado");
        onSuccess?.();
        router.push(`/leads/${created.id}`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form action={onSubmit} className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome" htmlFor="firstName">
          <Input id="firstName" name="firstName" required defaultValue={defaults?.firstName} />
        </Field>
        <Field label="Sobrenome" htmlFor="lastName">
          <Input id="lastName" name="lastName" defaultValue={defaults?.lastName ?? ""} />
        </Field>
        <Field label="Empresa" htmlFor="companyName">
          <Input id="companyName" name="companyName" defaultValue={defaults?.companyName ?? ""} />
        </Field>
        <Field label="Empresa cadastrada" htmlFor="companyId">
          <NativeSelect id="companyId" name="companyId" defaultValue={defaults?.companyId ?? ""}>
            <option value="">Nenhuma</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Telefone" htmlFor="phone">
          <Input id="phone" name="phone" defaultValue={defaults?.phone ?? ""} />
        </Field>
        <Field label="WhatsApp" htmlFor="whatsapp">
          <Input id="whatsapp" name="whatsapp" defaultValue={defaults?.whatsapp ?? ""} />
        </Field>
        <Field label="E-mail" htmlFor="email">
          <Input id="email" name="email" type="email" defaultValue={defaults?.email ?? ""} />
        </Field>
        <Field label="Cargo" htmlFor="jobTitle">
          <Input id="jobTitle" name="jobTitle" defaultValue={defaults?.jobTitle ?? ""} />
        </Field>
        <Field label="Cidade" htmlFor="city">
          <Input id="city" name="city" defaultValue={defaults?.city ?? ""} />
        </Field>
        <Field label="Estado" htmlFor="state">
          <Input id="state" name="state" defaultValue={defaults?.state ?? ""} />
        </Field>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Field label="Origem" htmlFor="sourceId">
          <NativeSelect id="sourceId" name="sourceId" defaultValue={defaults?.sourceId ?? ""}>
            <option value="">Selecione</option>
            {sources.map((source) => (
              <option key={source.id} value={source.id}>
                {source.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Etapa" htmlFor="stageId">
          <NativeSelect id="stageId" name="stageId" defaultValue={defaults?.stageId ?? ""}>
            <option value="">Etapa inicial</option>
            {stages.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
        {canAssign ? (
          <Field label="Responsável" htmlFor="ownerId">
            <NativeSelect id="ownerId" name="ownerId" defaultValue={defaults?.ownerId ?? ""}>
              <option value="">Você</option>
              {users.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </NativeSelect>
          </Field>
        ) : null}
        <Field label="Valor estimado" htmlFor="estimatedValue">
          <Input
            id="estimatedValue"
            name="estimatedValue"
            type="number"
            min="0"
            step="0.01"
            defaultValue={defaults?.estimatedValue ?? ""}
          />
        </Field>
        <Field label="Probabilidade (%)" htmlFor="probability">
          <Input
            id="probability"
            name="probability"
            type="number"
            min="0"
            max="100"
            defaultValue={defaults?.probability ?? ""}
          />
        </Field>
        <Field label="Produto/serviço de interesse" htmlFor="interest">
          <Input id="interest" name="interest" defaultValue={defaults?.interest ?? ""} />
        </Field>
      </section>

      <div>
        <p className="mb-2 text-sm font-medium">Tags</p>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => {
            const active = tagIds.includes(tag.id);
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() =>
                  setTagIds((current) =>
                    current.includes(tag.id)
                      ? current.filter((id) => id !== tag.id)
                      : [...current, tag.id],
                  )
                }
                className={`rounded-full border px-3 py-1 text-xs ${
                  active ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground"
                }`}
              >
                {tag.name}
              </button>
            );
          })}
        </div>
      </div>

      <Field label="Observações" htmlFor="notes">
        <Textarea id="notes" name="notes" defaultValue={defaults?.notes ?? ""} />
      </Field>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : leadId ? "Salvar alterações" : "Criar lead"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
