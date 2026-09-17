import Link from "next/link";
import { OverviewCharts } from "@/components/dashboard/overview-charts";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getSessionUser } from "@/lib/auth/session";
import { getDashboardData } from "@/lib/queries/dashboard";
import { rangeFromPreset, type DatePreset } from "@/lib/dates";
import { formatCurrency, formatPercent } from "@/lib/format";

const presets: { id: DatePreset; label: string }[] = [
  { id: "today", label: "Hoje" },
  { id: "7d", label: "7 dias" },
  { id: "30d", label: "30 dias" },
  { id: "month", label: "Este mês" },
];

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { period?: DatePreset; from?: string; to?: string };
}) {
  const user = await getSessionUser();
  if (!user) return null;

  const period = searchParams.period ?? "month";
  const range = rangeFromPreset(period, searchParams.from, searchParams.to);
  const data = await getDashboardData(user, range);

  const cards = [
    { label: "Novos leads", value: data.cards.newLeads },
    { label: "Em atendimento", value: data.cards.attending },
    { label: "Propostas abertas", value: data.cards.proposals },
    { label: "Negociações", value: data.cards.negotiations },
    { label: "Vendas fechadas", value: data.cards.won },
    { label: "Leads perdidos", value: data.cards.lost },
    { label: "Valor em negociação", value: formatCurrency(data.cards.pipelineValue) },
    { label: "Receita fechada", value: formatCurrency(data.cards.closedRevenue) },
  ];

  return (
    <div>
      <PageHeader
        title="Visão geral"
        description="Um olhar rápido sobre o que precisa de atenção hoje."
        actions={
          <div className="flex flex-wrap gap-2">
            {presets.map((item) => (
              <Link
                key={item.id}
                href={`/?period=${item.id}`}
                className={`rounded-md border px-3 py-1.5 text-sm ${
                  period === item.id ? "border-primary bg-primary/10 text-primary" : "bg-card"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <form className="flex gap-2">
              <input type="hidden" name="period" value="custom" />
              <input
                type="date"
                name="from"
                defaultValue={searchParams.from}
                className="h-9 rounded-md border bg-background px-2 text-sm"
              />
              <input
                type="date"
                name="to"
                defaultValue={searchParams.to}
                className="h-9 rounded-md border bg-background px-2 text-sm"
              />
              <button className="rounded-md border px-3 text-sm" type="submit">
                Personalizado
              </button>
            </form>
          </div>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-5">
        <Kpi label="Conversão" value={formatPercent(data.kpis.conversion)} />
        <Kpi label="Ticket médio" value={formatCurrency(data.kpis.ticket)} />
        <Kpi label="Leads do período" value={String(data.kpis.monthLeads)} />
        <Kpi label="Clientes conquistados" value={String(data.kpis.wonLeads)} />
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Alertas</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Link href="/follow-ups">
              <Badge variant={data.kpis.overdueFollowUps ? "danger" : "success"}>
                {data.kpis.overdueFollowUps} follow-ups atrasados
              </Badge>
            </Link>
            <Link href="/tasks">
              <Badge variant={data.kpis.pendingTasks ? "warning" : "secondary"}>
                {data.kpis.pendingTasks} tarefas pendentes
              </Badge>
            </Link>
          </CardContent>
        </Card>
      </div>

      <OverviewCharts
        leadsByDay={data.leadsByDay}
        salesByDay={data.salesByDay}
        sources={data.sources}
      />
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xl font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}
