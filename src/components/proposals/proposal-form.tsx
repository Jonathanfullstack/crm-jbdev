"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { createProposalAction } from "@/actions/proposals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/format";
import { fullName } from "@/lib/utils";

type LeadOption = { id: string; firstName: string; lastName: string | null };
type OpportunityOption = { id: string; title: string; leadId: string };

export function ProposalForm({
  leads,
  opportunities,
}: {
  leads: LeadOption[];
  opportunities: OpportunityOption[];
}) {
  const [leadId, setLeadId] = useState(leads[0]?.id ?? "");
  const [items, setItems] = useState([{ name: "", quantity: 1, unitPrice: 0 }]);
  const total = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0), 0),
    [items],
  );
  const related = opportunities.filter((item) => item.leadId === leadId);

  return (
    <form
      className="grid gap-3 md:grid-cols-2"
      action={async (formData) => {
        try {
          await createProposalAction({
            leadId,
            opportunityId: String(formData.get("opportunityId") || "") || null,
            title: String(formData.get("title") || "Proposta comercial"),
            description: String(formData.get("description") ?? ""),
            validUntil: String(formData.get("validUntil") || ""),
            status: String(formData.get("status") || "DRAFT"),
            items: items.filter((item) => item.name.trim()),
            value: total,
          });
          toast.success("Proposta criada");
          setItems([{ name: "", quantity: 1, unitPrice: 0 }]);
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Não foi possível criar a proposta.");
        }
      }}
    >
      <Input name="title" placeholder="Título" defaultValue="Proposta comercial" required />
      <NativeSelect value={leadId} onChange={(event) => setLeadId(event.target.value)} required>
        <option value="">Lead / cliente</option>
        {leads.map((lead) => (
          <option key={lead.id} value={lead.id}>
            {fullName(lead.firstName, lead.lastName)}
          </option>
        ))}
      </NativeSelect>
      <NativeSelect name="opportunityId">
        <option value="">Oportunidade (opcional)</option>
        {related.map((item) => (
          <option key={item.id} value={item.id}>
            {item.title}
          </option>
        ))}
      </NativeSelect>
      <NativeSelect name="status" defaultValue="DRAFT">
        <option value="DRAFT">Rascunho</option>
        <option value="SENT">Enviada</option>
      </NativeSelect>
      <Input name="validUntil" type="date" />
      <Textarea name="description" placeholder="Condições, prazo e observações" className="md:col-span-2" />
      <div className="space-y-2 md:col-span-2">
        {items.map((item, index) => (
          <div key={index} className="grid gap-2 md:grid-cols-[1fr_100px_140px]">
            <Input
              value={item.name}
              onChange={(event) =>
                setItems((current) =>
                  current.map((row, rowIndex) =>
                    rowIndex === index ? { ...row, name: event.target.value } : row,
                  ),
                )
              }
              placeholder="Item"
            />
            <Input
              type="number"
              min="1"
              value={item.quantity}
              onChange={(event) =>
                setItems((current) =>
                  current.map((row, rowIndex) =>
                    rowIndex === index ? { ...row, quantity: Number(event.target.value) } : row,
                  ),
                )
              }
            />
            <Input
              type="number"
              min="0"
              step="0.01"
              value={item.unitPrice}
              onChange={(event) =>
                setItems((current) =>
                  current.map((row, rowIndex) =>
                    rowIndex === index ? { ...row, unitPrice: Number(event.target.value) } : row,
                  ),
                )
              }
              placeholder="Valor"
            />
          </div>
        ))}
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => setItems((current) => [...current, { name: "", quantity: 1, unitPrice: 0 }])}
          >
            Adicionar item
          </Button>
          <p className="text-sm font-medium tabular-nums">Total {formatCurrency(total)}</p>
        </div>
      </div>
      <Button type="submit" className="w-fit">
        Criar proposta
      </Button>
    </form>
  );
}
