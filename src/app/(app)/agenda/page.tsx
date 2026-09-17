import Link from "next/link";
import { addDays, format, isSameDay, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { completeFollowUpAction } from "@/actions/follow-ups";
import { updateTaskStatusAction } from "@/actions/tasks";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSessionUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { followUpTypeLabel, priorityLabel } from "@/lib/labels";
import { formatDateTime } from "@/lib/format";
import { fullName } from "@/lib/utils";

export default async function AgendaPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const ownerFilter = user.role === "SELLER" ? { ownerId: user.id } : {};
  const horizon = addDays(startOfDay(new Date()), 7);

  const [followUps, tasks] = await Promise.all([
    db.followUp.findMany({
      where: {
        workspaceId: user.workspaceId,
        completedAt: null,
        dueAt: { lte: horizon },
        ...ownerFilter,
      },
      include: { lead: true, owner: true },
      orderBy: { dueAt: "asc" },
    }),
    db.task.findMany({
      where: {
        workspaceId: user.workspaceId,
        status: { not: "DONE" },
        ...ownerFilter,
      },
      include: { lead: true, owner: true },
      orderBy: { dueAt: "asc" },
    }),
  ]);

  const days = Array.from({ length: 8 }, (_, index) => addDays(startOfDay(new Date()), index - 1));
  const overdueDay = days[0];

  return (
    <div>
      <PageHeader
        title="Agenda"
        description="Follow-ups e tarefas da semana, com atrasados em evidência."
      />
      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        {days.map((day) => {
          const isOverdueColumn = isSameDay(day, overdueDay);
          const dayFollowUps = followUps.filter((item) =>
            isOverdueColumn ? item.dueAt < startOfDay(new Date()) : isSameDay(item.dueAt, day),
          );
          const dayTasks = tasks.filter((item) => {
            if (!item.dueAt) return false;
            return isOverdueColumn ? item.dueAt < startOfDay(new Date()) : isSameDay(item.dueAt, day);
          });
          const title = isOverdueColumn
            ? "Atrasados"
            : format(day, "EEEE dd/MM", { locale: ptBR });

          return (
            <Card key={day.toISOString()}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base capitalize">
                  {title}
                  <Badge variant={isOverdueColumn ? "danger" : "secondary"}>
                    {dayFollowUps.length + dayTasks.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {dayFollowUps.length === 0 && dayTasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nada agendado.</p>
                ) : null}
                {dayFollowUps.map((item) => (
                  <div key={item.id} className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Follow-up · {followUpTypeLabel[item.type]}</p>
                    <Link href={`/leads/${item.leadId}`} className="font-medium hover:underline">
                      {fullName(item.lead.firstName, item.lead.lastName)}
                    </Link>
                    <p className="text-xs text-muted-foreground">{formatDateTime(item.dueAt)}</p>
                    <form action={completeFollowUpAction.bind(null, item.id)} className="mt-2">
                      <Button size="sm" variant="secondary" type="submit">
                        Concluir
                      </Button>
                    </form>
                  </div>
                ))}
                {dayTasks.map((item) => (
                  <div key={item.id} className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Tarefa · {priorityLabel[item.priority]}</p>
                    <p className="font-medium">{item.title}</p>
                    {item.lead ? (
                      <Link href={`/leads/${item.lead.id}`} className="text-xs text-muted-foreground hover:underline">
                        {fullName(item.lead.firstName, item.lead.lastName)}
                      </Link>
                    ) : null}
                    <form
                      action={async () => {
                        "use server";
                        await updateTaskStatusAction(item.id, "DONE");
                      }}
                      className="mt-2"
                    >
                      <Button size="sm" variant="secondary" type="submit">
                        Concluir
                      </Button>
                    </form>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
