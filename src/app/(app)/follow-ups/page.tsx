import Link from "next/link";
import { endOfDay, isToday, startOfDay } from "date-fns";
import { completeFollowUpAction } from "@/actions/follow-ups";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSessionUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { followUpTypeLabel, priorityLabel } from "@/lib/labels";
import { formatDateTime } from "@/lib/format";
import { fullName } from "@/lib/utils";

export default async function FollowUpsPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const ownerFilter = user.role === "SELLER" ? { ownerId: user.id } : {};
  const items = await db.followUp.findMany({
    where: { workspaceId: user.workspaceId, ...ownerFilter },
    include: { lead: true, owner: true },
    orderBy: { dueAt: "asc" },
  });

  const now = new Date();
  const today = items.filter(
    (item) => !item.completedAt && isToday(item.dueAt),
  );
  const overdue = items.filter(
    (item) => !item.completedAt && item.dueAt < startOfDay(now),
  );
  const upcoming = items.filter(
    (item) => !item.completedAt && item.dueAt > endOfDay(now),
  );
  const done = items.filter((item) => item.completedAt);

  return (
    <div>
      <PageHeader
        title="Meus follow-ups"
        description="Nenhum lead deve ficar esquecido."
      />
      <div className="grid gap-4 xl:grid-cols-2">
        <Group title="Atrasados" items={overdue} tone="danger" />
        <Group title="Hoje" items={today} tone="warning" />
        <Group title="Próximos" items={upcoming} />
        <Group title="Concluídos" items={done} />
      </div>
    </div>
  );
}

function Group({
  title,
  items,
  tone,
}: {
  title: string;
  tone?: "danger" | "warning";
  items: {
    id: string;
    type: keyof typeof followUpTypeLabel;
    priority: keyof typeof priorityLabel;
    dueAt: Date;
    completedAt: Date | null;
    description: string | null;
    lead: { id: string; firstName: string; lastName: string | null };
    owner: { name: string };
  }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {title}
          <Badge variant={tone === "danger" ? "danger" : tone === "warning" ? "warning" : "secondary"}>
            {items.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nada por aqui.</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="rounded-lg border p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Link href={`/leads/${item.lead.id}`} className="font-medium hover:underline">
                    {fullName(item.lead.firstName, item.lead.lastName)}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {followUpTypeLabel[item.type]} · {formatDateTime(item.dueAt)} · {item.owner.name}
                  </p>
                  {item.description ? <p className="mt-1 text-sm">{item.description}</p> : null}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant="outline">{priorityLabel[item.priority]}</Badge>
                  {!item.completedAt ? (
                    <form action={completeFollowUpAction.bind(null, item.id)}>
                      <Button size="sm" variant="secondary" type="submit">
                        Concluir
                      </Button>
                    </form>
                  ) : null}
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
