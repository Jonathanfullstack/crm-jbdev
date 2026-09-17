"use client";

import { useState } from "react";
import { toast } from "sonner";
import { updateAppearanceAction } from "@/actions/settings";
import { BrandMark } from "@/components/brand/brand-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { hexToHsl } from "@/lib/utils";
import { NEUTRAL_BRAND } from "@/lib/branding";

type AppearanceValues = {
  name: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string;
  secondaryColor: string | null;
  theme: "LIGHT" | "DARK" | "SYSTEM";
  showDeveloperCredit: boolean;
};

export function AppearanceForm({ defaults }: { defaults: AppearanceValues }) {
  const [values, setValues] = useState<AppearanceValues>({
    ...defaults,
    name: defaults.name || NEUTRAL_BRAND.name,
    primaryColor: defaults.primaryColor || NEUTRAL_BRAND.primaryColor,
  });
  const [useSecondary, setUseSecondary] = useState(Boolean(defaults.secondaryColor));
  const [pending, setPending] = useState(false);
  const previewPrimary = hexToHsl(values.primaryColor || NEUTRAL_BRAND.primaryColor);

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <form
        className="grid gap-4"
        action={async () => {
          setPending(true);
          try {
            await updateAppearanceAction({
              ...values,
              secondaryColor: useSecondary ? values.secondaryColor : null,
            });
            toast.success("Aparência atualizada");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Não foi possível salvar.");
          } finally {
            setPending(false);
          }
        }}
      >
        <Field label="Nome da empresa" htmlFor="companyName">
          <Input
            id="companyName"
            value={values.name}
            onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
            required
          />
        </Field>
        <Field label="Logo (URL)" htmlFor="logoUrl">
          <Input
            id="logoUrl"
            value={values.logoUrl ?? ""}
            onChange={(event) => setValues((current) => ({ ...current, logoUrl: event.target.value }))}
            placeholder="https://"
          />
        </Field>
        <Field label="Favicon (URL)" htmlFor="faviconUrl">
          <Input
            id="faviconUrl"
            value={values.faviconUrl ?? ""}
            onChange={(event) => setValues((current) => ({ ...current, faviconUrl: event.target.value }))}
            placeholder="https://"
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Cor principal" htmlFor="primaryColor">
            <Input
              id="primaryColor"
              type="color"
              value={values.primaryColor}
              onChange={(event) => setValues((current) => ({ ...current, primaryColor: event.target.value }))}
            />
          </Field>
          <Field label="Cor secundária (opcional)" htmlFor="secondaryColor">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={useSecondary}
                onChange={(event) => setUseSecondary(event.target.checked)}
                aria-label="Usar cor secundária"
              />
              <Input
                id="secondaryColor"
                type="color"
                disabled={!useSecondary}
                value={values.secondaryColor || "#e2e8f0"}
                onChange={(event) => setValues((current) => ({ ...current, secondaryColor: event.target.value }))}
              />
            </div>
          </Field>
        </div>
        <Field label="Tema" htmlFor="theme">
          <NativeSelect
            id="theme"
            value={values.theme}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                theme: event.target.value as AppearanceValues["theme"],
              }))
            }
          >
            <option value="LIGHT">Claro</option>
            <option value="DARK">Escuro</option>
            <option value="SYSTEM">Sistema</option>
          </NativeSelect>
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={values.showDeveloperCredit}
            onChange={(event) =>
              setValues((current) => ({ ...current, showDeveloperCredit: event.target.checked }))
            }
          />
          Mostrar crédito do desenvolvedor no rodapé
        </label>
        <Button type="submit" className="w-fit" disabled={pending}>
          {pending ? "Salvando..." : "Salvar aparência"}
        </Button>
      </form>

      <div
        className={`overflow-hidden rounded-xl border shadow-soft ${values.theme === "DARK" ? "dark bg-zinc-950 text-zinc-50" : "bg-background"}`}
        style={{ ["--primary" as string]: previewPrimary }}
      >
        <div className="flex min-h-[280px]">
          <aside className="w-44 bg-zinc-950 p-4 text-zinc-100">
            <div className="mb-6 flex items-center gap-2">
              <BrandMark name={values.name || NEUTRAL_BRAND.name} logoUrl={values.logoUrl} />
              <div>
                <p className="truncate text-xs font-semibold">{values.name || NEUTRAL_BRAND.name}</p>
                <p className="text-[10px] text-zinc-400">CRM</p>
              </div>
            </div>
            <div className="space-y-1 text-xs">
              <div className="rounded-md bg-primary px-2 py-1.5 text-primary-foreground">Visão geral</div>
              <div className="rounded-md px-2 py-1.5 text-zinc-400">Leads</div>
              <div className="rounded-md px-2 py-1.5 text-zinc-400">Funil</div>
            </div>
          </aside>
          <div className="flex-1 p-4">
            <p className="text-sm font-semibold">Preview</p>
            <p className="mt-1 text-xs text-muted-foreground">A identidade é aplicada em todo o workspace.</p>
            <button className="mt-4 rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground">
              Novo lead
            </button>
          </div>
        </div>
      </div>
    </div>
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
