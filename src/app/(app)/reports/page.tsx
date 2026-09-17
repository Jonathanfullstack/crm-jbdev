import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSessionUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { getReportsData } from "@/lib/queries/reports";
import { rangeFromPreset, type DatePreset } from "@/lib/dates";
import { formatCurrency, formatPercent } from "@/lib/format";

const presets: { id: DatePreset; label: string }[] = [
  { id: "7d", label: "7 dias" },
  { id: "30d", label: "30 dias" },
  { id: "month", label: "Este mês" },
];

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: { period?: DatePreset };
}) {
  const user = await getSessionUser();
  if (!user) return null;
  if (!hasPermission(user.role, "reports:read")) redirect("/");

  const period = searchParams.period ?? "month";
  const range = rangeFromPreset(period);
  const data = await getReportsData(user, range);

  return (
    <div>
      <PageHeader
        title="Relatórios"
        description="Números simples para entender o desempenho comercial."
        actions={
          <div className="flex flex-wrap gap-2">
            {presets.map((item) => (
              <Link
                key={item.id}
                href={`/reports?period=${item.id}`}
                className={`rounded-md border px-3 py-1.5 text-sm ${
                  period === item.id ? "border-primary bg-primary/10 text-primary" : "bg-card"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        }
      />
      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Stat label="Leads recebidos" value={String(data.received)} />
        <Stat label="Conversão" value={formatPercent(data.conversion)} />
        <Stat label="Valor vendido" value={formatCurrency(data.soldValue)} />
        <Stat label="Oportunidades perdidas" value={String(data.lostCount)} />
        <Stat label="Tempo médio de fechamento" value={`${Math.round(data.avgCloseDays)} dias`} />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <ListCard title="Leads por origem" rows={data.sources.map((item) => [item.name, String(item.count)])} />
        <ListCard
          title="Vendas por responsável"
          rows={data.owners.map((item) => [item.name, `${item.count} · ${formatCurrency(item.value)}`])}
        />
        <ListCard title="Motivos de perda" rows={data.lostReasons.map((item) => [item.name, String(item.count)])} />
        <ListCard title="Desempenho do funil" rows={data.funnel.map((item) => [item.name, String(item.count)])} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xl font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}

function ListCard({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between text-sm">
            <span>{label}</span>
            <span className="tabular-nums text-muted-foreground">{value}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
