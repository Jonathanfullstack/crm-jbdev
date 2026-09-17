"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import { toast } from "sonner";
import { moveLeadAction } from "@/actions/leads";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatRelative } from "@/lib/format";
import { fullName } from "@/lib/utils";

type Stage = {
  id: string;
  name: string;
  color: string;
  kind: "OPEN" | "WON" | "LOST";
};

type LeadCard = {
  id: string;
  firstName: string;
  lastName: string | null;
  companyName: string | null;
  phone: string | null;
  estimatedValue: number | null;
  owner?: { name: string } | null;
  source?: { name: string } | null;
  lastContactAt: Date | null;
  nextFollowUpAt: Date | null;
  tags: { id: string; name: string; color: string }[];
  stageId: string;
};

export function KanbanBoard({
  stages,
  leads,
  lostReasons,
}: {
  stages: Stage[];
  leads: LeadCard[];
  lostReasons: { id: string; name: string }[];
}) {
  const [items, setItems] = useState(leads);
  const [lostLead, setLostLead] = useState<{ leadId: string; stageId: string } | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const grouped = useMemo(() => {
    return stages.map((stage) => ({
      stage,
      leads: items.filter((lead) => lead.stageId === stage.id),
    }));
  }, [items, stages]);

  async function applyMove(leadId: string, stageId: string, lostReasonId?: string, lostNotes?: string) {
    const previous = items;
    setItems((current) =>
      current.map((lead) => (lead.id === leadId ? { ...lead, stageId } : lead)),
    );
    try {
      await moveLeadAction({ leadId, stageId, lostReasonId, lostNotes });
    } catch (error) {
      setItems(previous);
      toast.error(error instanceof Error ? error.message : "Não foi possível mover o lead.");
    }
  }

  function onDragEnd(event: DragEndEvent) {
    const leadId = String(event.active.id);
    const overId = event.over?.id ? String(event.over.id) : null;
    if (!overId) return;

    const targetStage =
      stages.find((stage) => stage.id === overId) ??
      stages.find((stage) => items.find((lead) => lead.id === overId)?.stageId === stage.id);
    if (!targetStage) return;

    const lead = items.find((item) => item.id === leadId);
    if (!lead || lead.stageId === targetStage.id) return;

    if (targetStage.kind === "LOST") {
      setLostLead({ leadId, stageId: targetStage.id });
      return;
    }

    void applyMove(leadId, targetStage.id);
  }

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={onDragEnd}>
        <div className="kanban-scroll flex gap-4 overflow-x-auto pb-4">
          {grouped.map(({ stage, leads: columnLeads }) => (
            <KanbanColumn key={stage.id} stage={stage} leads={columnLeads} />
          ))}
        </div>
      </DndContext>

      <Dialog open={Boolean(lostLead)} onOpenChange={(open) => !open && setLostLead(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Por que este negócio foi perdido?</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (!lostLead) return;
              const form = new FormData(event.currentTarget);
              void applyMove(
                lostLead.leadId,
                lostLead.stageId,
                String(form.get("lostReasonId")),
                String(form.get("lostNotes") ?? ""),
              );
              setLostLead(null);
            }}
          >
            <NativeSelect name="lostReasonId" required>
              <option value="">Selecione o motivo</option>
              {lostReasons.map((reason) => (
                <option key={reason.id} value={reason.id}>
                  {reason.name}
                </option>
              ))}
            </NativeSelect>
            <Textarea name="lostNotes" placeholder="Observação opcional" />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setLostLead(null)}>
                Cancelar
              </Button>
              <Button type="submit">Confirmar perda</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function KanbanColumn({ stage, leads }: { stage: Stage; leads: LeadCard[] }) {
  const { setNodeRef } = useDroppable({ id: stage.id });

  return (
    <div className="w-[300px] shrink-0">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
          <h3 className="text-sm font-semibold">{stage.name}</h3>
        </div>
        <span className="text-xs text-muted-foreground">{leads.length}</span>
      </div>
      <SortableContext items={leads.map((lead) => lead.id)} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="min-h-[160px] space-y-3 rounded-xl bg-muted/50 p-2">
          {leads.map((lead) => (
            <KanbanCard key={lead.id} lead={lead} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

function KanbanCard({ lead }: { lead: LeadCard }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`rounded-xl border bg-card p-3 shadow-soft ${isDragging ? "opacity-70" : ""}`}
      {...attributes}
      {...listeners}
    >
      <Link href={`/leads/${lead.id}`} className="block space-y-2">
        <div>
          <p className="text-sm font-semibold">{fullName(lead.firstName, lead.lastName)}</p>
          <p className="text-xs text-muted-foreground">{lead.companyName || "Sem empresa"}</p>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{lead.phone || "Sem telefone"}</span>
          <span className="tabular-nums font-medium text-foreground">
            {formatCurrency(lead.estimatedValue)}
          </span>
        </div>
        <div className="flex flex-wrap gap-1">
          {lead.source ? <Badge variant="secondary">{lead.source.name}</Badge> : null}
          {lead.tags.slice(0, 2).map((tag) => (
            <Badge key={tag.id} variant="outline" style={{ borderColor: tag.color, color: tag.color }}>
              {tag.name}
            </Badge>
          ))}
        </div>
        <div className="text-[11px] text-muted-foreground">
          <p>Resp.: {lead.owner?.name ?? "—"}</p>
          <p>Última interação: {formatRelative(lead.lastContactAt)}</p>
          <p>Próxima atividade: {formatRelative(lead.nextFollowUpAt)}</p>
        </div>
      </Link>
    </div>
  );
}
