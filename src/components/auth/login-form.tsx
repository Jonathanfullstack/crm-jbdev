"use client";

import { useState } from "react";
import Link from "next/link";
import { loginAction } from "@/actions/auth";
import { BrandMark } from "@/components/brand/brand-mark";
import { BrandApplier } from "@/components/brand/brand-applier";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { WorkspaceBrand } from "@/lib/branding";

const features = [
  "Funil kanban com ganho e perda",
  "Propostas com documento para imprimir",
  "Agenda de follow-ups e tarefas",
  "Relatórios, API e importação CSV",
];

export function LoginForm({
  brand,
  workspaceSlug,
  demos,
}: {
  brand: WorkspaceBrand;
  workspaceSlug?: string;
  demos: { name: string; slug: string; email: string }[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_hsl(var(--muted))_0%,_transparent_45%),hsl(var(--background))]">
      <BrandApplier brand={brand} />
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-4 py-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <p className="text-sm font-medium text-muted-foreground">JBDev · CRM comercial</p>
          <div>
            <h1 className="text-4xl font-semibold tracking-tight">
              Centralize leads, organize o funil e não perca venda por falta de follow-up.
            </h1>
            <p className="mt-4 max-w-xl text-muted-foreground">
              CRM white-label para times comerciais. Cada empresa entra com a própria identidade, sem
              cadastro público nem cobrança — pensado para operação real e para o portfólio da JBDev.
            </p>
          </div>
          <ul className="grid gap-2 text-sm sm:grid-cols-2">
            {features.map((feature) => (
              <li key={feature} className="rounded-lg border bg-card px-3 py-2">
                {feature}
              </li>
            ))}
          </ul>
          {demos.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">Ambientes de demonstração</p>
              <div className="flex flex-wrap gap-2">
                {demos.map((demo) => (
                  <Link
                    key={demo.slug}
                    href={`/login?w=${demo.slug}`}
                    className="rounded-md border bg-card px-3 py-2 text-sm hover:border-primary"
                  >
                    {demo.name}
                    <span className="block text-xs text-muted-foreground">{demo.email}</span>
                  </Link>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Senha das demos: Demo@1234</p>
            </div>
          ) : null}
        </div>

        <Card className="w-full">
          <CardHeader className="space-y-3">
            <BrandMark name={brand.name} logoUrl={brand.logoUrl} />
            <div>
              <CardTitle className="text-2xl">Entrar</CardTitle>
              <CardDescription className="mt-1">
                {workspaceSlug
                  ? `Acesse ${brand.name} para acompanhar leads, clientes e follow-ups.`
                  : "Acesse sua conta para acompanhar leads, clientes e follow-ups."}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              action={async (formData) => {
                setPending(true);
                setError(null);
                const result = await loginAction(formData);
                if (result?.error) setError(result.error);
                setPending(false);
              }}
            >
              {workspaceSlug ? <input type="hidden" name="workspaceSlug" value={workspaceSlug} /> : null}
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" name="email" type="email" required placeholder="voce@empresa.com" autoComplete="email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input id="password" name="password" type="password" required autoComplete="current-password" />
              </div>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? "Entrando..." : "Entrar"}
              </Button>
            </form>
            <p className="mt-6 text-center text-[11px] text-muted-foreground">Desenvolvido por JBDev</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
