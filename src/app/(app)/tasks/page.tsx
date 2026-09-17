import Link from "next/link";
import { createTaskAction, updateTaskStatusAction } from "@/actions/tasks";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { getSessionUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { priorityLabel, taskStatusLabel } from "@/lib/labels";
import { formatDateTime } from "@/lib/format";
import { fullName } from "@/lib/utils";

export default async function TasksPage() {
  const user = await getSessionUser();
  if (!user) return null;

  const ownerFilter = user.role === "SELLER" ? { ownerId: user.id } : {};
  const [tasks, users, leads] = await Promise.all([
    db.task.findMany({
      where: { workspaceId: user.workspaceId, ...ownerFilter },
      include: { owner: true, lead: true },
      orderBy: [{ status: "asc" }, { dueAt: "asc" }],
    }),
    db.user.findMany({
      where: { workspaceId: user.workspaceId, status: "ACTIVE" },
      select: { id: true, name: true },
    }),
    db.lead.findMany({
      where: { workspaceId: user.workspaceId },
      select: { id: true, firstName: true, lastName: true },
      take: 80,
    }),
  ]);

  return (
    <div>
      <PageHeader title="Tarefas" description="O que precisa ser feito pela equipe." />
      <Card className="mb-6">
        <CardContent className="pt-6">
          <form
            className="grid gap-3 md:grid-cols-2 xl:grid-cols-6"
            action={async (formData) => {
              "use server";
              await createTaskAction({
                title: String(formData.get("title")),
                description: String(formData.get("description") ?? ""),
                ownerId: String(formData.get("ownerId")),
                leadId: String(formData.get("leadId") || "") || null,
                dueAt: String(formData.get("dueAt") || "") || null,
                priority: String(formData.get("priority") || "MEDIUM"),
              });
            }}
          >
            <Input name="title" placeholder="Título" required className="xl:col-span-2" />
            <NativeSelect name="ownerId" defaultValue={user.id}>
              {users.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </NativeSelect>
            <NativeSelect name="leadId">
              <option value="">Lead relacionado</option>
              {leads.map((lead) => (
                <option key={lead.id} value={lead.id}>
                  {fullName(lead.firstName, lead.lastName)}
                </option>
              ))}
            </NativeSelect>
            <Input name="dueAt" type="datetime-local" />
            <NativeSelect name="priority" defaultValue="MEDIUM">
              <option value="LOW">Baixa</option>
              <option value="MEDIUM">Média</option>
              <option value="HIGH">Alta</option>
            </NativeSelect>
            <Textarea name="description" placeholder="Descrição" className="md:col-span-2 xl:col-span-5" />
            <Button type="submit">Criar tarefa</Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {tasks.map((task) => (
          <Card key={task.id}>
            <CardContent className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-medium">{task.title}</p>
                <p className="text-sm text-muted-foreground">
                  {task.owner.name}
                  {task.lead ? (
                    <>
                      {" · "}
                      <Link href={`/leads/${task.lead.id}`} className="hover:underline">
                        {fullName(task.lead.firstName, task.lead.lastName)}
                      </Link>
                    </>
                  ) : null}
                  {task.dueAt ? ` · ${formatDateTime(task.dueAt)}` : ""}
                </p>
                {task.description ? <p className="mt-1 text-sm">{task.description}</p> : null}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{priorityLabel[task.priority]}</Badge>
                <Badge variant={task.status === "DONE" ? "success" : "secondary"}>
                  {taskStatusLabel[task.status]}
                </Badge>
                {task.status !== "DONE" ? (
                  <form
                    action={async () => {
                      "use server";
                      await updateTaskStatusAction(
                        task.id,
                        task.status === "PENDING" ? "IN_PROGRESS" : "DONE",
                      );
                    }}
                  >
                    <Button size="sm" variant="secondary">
                      {task.status === "PENDING" ? "Iniciar" : "Concluir"}
                    </Button>
                  </form>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
