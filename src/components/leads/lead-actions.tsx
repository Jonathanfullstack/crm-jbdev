"use client";

import { useState } from "react";
import { Mail, MessageCircle, Phone, Plus } from "lucide-react";
import { toast } from "sonner";
import { addNoteAction, moveLeadAction } from "@/actions/leads";
import { createFollowUpAction } from "@/actions/follow-ups";
import { createTaskAction } from "@/actions/tasks";
import { createProposalAction } from "@/actions/proposals";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { emailHref, phoneHref, whatsappHref } from "@/lib/format";

type Stage = { id: string; name: string; kind: "OPEN" | "WON" | "LOST" };

export function LeadQuickActions({
  leadId,
  phone,
  whatsapp,
  email,
  stages,
  currentStageId,
  lostReasons,
  users,
  ownerId,
}: {
  leadId: string;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  stages: Stage[];
  currentStageId: string;
  lostReasons: { id: string; name: string }[];
  users: { id: string; name: string }[];
  ownerId?: string | null;
}) {
  const wa = whatsappHref(whatsapp || phone);
  const tel = phoneHref(phone);
  const mail = emailHref(email);

  return (
    <div className="flex flex-wrap gap-2">
      {wa ? (
        <Button asChild variant="outline" size="sm">
          <a href={wa} target="_blank" rel="noreferrer">
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </a>
        </Button>
      ) : null}
      {tel ? (
        <Button asChild variant="outline" size="sm">
          <a href={tel}>
            <Phone className="h-4 w-4" />
            Ligar
          </a>
        </Button>
      ) : null}
      {mail ? (
        <Button asChild variant="outline" size="sm">
          <a href={mail}>
            <Mail className="h-4 w-4" />
            E-mail
          </a>
        </Button>
      ) : null}
      <SimpleDialog title="Criar tarefa" trigger="Criar tarefa">
        <form
          className="space-y-3"
          action={async (formData) => {
            await createTaskAction({
              title: String(formData.get("title")),
              description: String(formData.get("description") ?? ""),
              ownerId: String(formData.get("ownerId") || ownerId || users[0]?.id),
              leadId,
              dueAt: String(formData.get("dueAt") || ""),
              priority: String(formData.get("priority") || "MEDIUM"),
            });
            toast.success("Tarefa criada");
          }}
        >
          <Input name="title" placeholder="Título" required />
          <Textarea name="description" placeholder="Descrição" />
          <NativeSelect name="ownerId" defaultValue={ownerId ?? ""}>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </NativeSelect>
          <Input name="dueAt" type="datetime-local" />
          <NativeSelect name="priority" defaultValue="MEDIUM">
            <option value="LOW">Baixa</option>
            <option value="MEDIUM">Média</option>
            <option value="HIGH">Alta</option>
          </NativeSelect>
          <Button type="submit">Salvar</Button>
        </form>
      </SimpleDialog>
      <SimpleDialog title="Adicionar observação" trigger="Adicionar observação">
        <form
          className="space-y-3"
          action={async (formData) => {
            await addNoteAction(leadId, String(formData.get("content") ?? ""));
            toast.success("Observação adicionada");
          }}
        >
          <Textarea name="content" required placeholder="O que aconteceu neste atendimento?" />
          <Button type="submit">Salvar</Button>
        </form>
      </SimpleDialog>
      <SimpleDialog title="Agendar follow-up" trigger="Follow-up">
        <form
          className="space-y-3"
          action={async (formData) => {
            await createFollowUpAction({
              leadId,
              ownerId: String(formData.get("ownerId") || ownerId || users[0]?.id),
              type: String(formData.get("type")),
              description: String(formData.get("description") ?? ""),
              dueAt: String(formData.get("dueAt")),
              priority: String(formData.get("priority") || "MEDIUM"),
            });
            toast.success("Follow-up agendado");
          }}
        >
          <NativeSelect name="type" defaultValue="WHATSAPP">
            <option value="CALL">Ligação</option>
            <option value="WHATSAPP">WhatsApp</option>
            <option value="EMAIL">E-mail</option>
            <option value="MEETING">Reunião</option>
            <option value="RETURN">Retorno</option>
            <option value="TASK">Tarefa</option>
            <option value="OTHER">Outro</option>
          </NativeSelect>
          <Input name="dueAt" type="datetime-local" required />
          <NativeSelect name="ownerId" defaultValue={ownerId ?? ""}>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.name}
              </option>
            ))}
          </NativeSelect>
          <NativeSelect name="priority" defaultValue="MEDIUM">
            <option value="LOW">Baixa</option>
            <option value="MEDIUM">Média</option>
            <option value="HIGH">Alta</option>
          </NativeSelect>
          <Textarea name="description" placeholder="O que precisa ser feito?" />
          <Button type="submit">Agendar</Button>
        </form>
      </SimpleDialog>
      <SimpleDialog title="Registrar proposta" trigger="Proposta">
        <form
          className="space-y-3"
          action={async (formData) => {
            await createProposalAction({
              leadId,
              title: String(formData.get("title") || "Proposta"),
              value: Number(formData.get("value")),
              description: String(formData.get("description") ?? ""),
              sentAt: String(formData.get("sentAt") || ""),
              validUntil: String(formData.get("validUntil") || ""),
              status: String(formData.get("status") || "SENT"),
            });
            toast.success("Proposta registrada");
          }}
        >
          <Input name="title" placeholder="Título da proposta" defaultValue="Proposta comercial" />
          <Input name="value" type="number" min="0" step="0.01" required placeholder="Valor" />
          <Textarea name="description" placeholder="Descrição" />
          <Input name="sentAt" type="date" />
          <Input name="validUntil" type="date" />
          <NativeSelect name="status" defaultValue="SENT">
            <option value="DRAFT">Rascunho</option>
            <option value="SENT">Enviada</option>
            <option value="VIEWED">Visualizada</option>
            <option value="ACCEPTED">Aceita</option>
            <option value="REJECTED">Recusada</option>
          </NativeSelect>
          <Button type="submit">Salvar</Button>
        </form>
      </SimpleDialog>
      <MoveStageButton
        leadId={leadId}
        stages={stages}
        currentStageId={currentStageId}
        lostReasons={lostReasons}
      />
    </div>
  );
}

function MoveStageButton({
  leadId,
  stages,
  currentStageId,
  lostReasons,
}: {
  leadId: string;
  stages: Stage[];
  currentStageId: string;
  lostReasons: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4" />
          Mover etapa
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mover etapa</DialogTitle>
        </DialogHeader>
        <form
          className="space-y-3"
          action={async (formData) => {
            await moveLeadAction({
              leadId,
              stageId: String(formData.get("stageId")),
              lostReasonId: String(formData.get("lostReasonId") || "") || null,
              lostNotes: String(formData.get("lostNotes") || ""),
            });
            toast.success("Etapa atualizada");
            setOpen(false);
          }}
        >
          <Label htmlFor="stageId">Nova etapa</Label>
          <NativeSelect id="stageId" name="stageId" defaultValue={currentStageId}>
            {stages.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.name}
              </option>
            ))}
          </NativeSelect>
          <NativeSelect name="lostReasonId">
            <option value="">Motivo de perda (se aplicável)</option>
            {lostReasons.map((reason) => (
              <option key={reason.id} value={reason.id}>
                {reason.name}
              </option>
            ))}
          </NativeSelect>
          <Textarea name="lostNotes" placeholder="Observação" />
          <Button type="submit">Mover</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SimpleDialog({
  title,
  trigger,
  children,
}: {
  title: string;
  trigger: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          {trigger}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
