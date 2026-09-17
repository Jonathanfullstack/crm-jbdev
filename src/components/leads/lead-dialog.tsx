"use client";

import { useState } from "react";
import { LeadForm, type LeadFormValues } from "@/components/leads/lead-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Option = { id: string; name: string };

export function LeadDialog({
  triggerLabel = "Novo lead",
  leadId,
  defaults,
  sources,
  stages,
  users,
  tags,
  companies,
  canAssign,
}: {
  triggerLabel?: string;
  leadId?: string;
  defaults?: Partial<LeadFormValues>;
  sources: Option[];
  stages: Option[];
  users: Option[];
  tags: Option[];
  companies: Option[];
  canAssign: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>{triggerLabel}</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{leadId ? "Editar lead" : "Novo lead"}</DialogTitle>
          <DialogDescription>Preencha só o essencial. O restante pode entrar depois.</DialogDescription>
        </DialogHeader>
        <LeadForm
          leadId={leadId}
          defaults={defaults}
          sources={sources}
          stages={stages}
          users={users}
          tags={tags}
          companies={companies}
          canAssign={canAssign}
          onSuccess={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
