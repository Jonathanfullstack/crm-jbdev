"use client";

import { useState } from "react";
import { toast } from "sonner";
import { importLeadsAction } from "@/actions/leads";
import { Button } from "@/components/ui/button";
import { parseCsv } from "@/lib/csv";

export function LeadImportButton() {
  const [pending, setPending] = useState(false);

  return (
    <label className="inline-flex">
      <input
        type="file"
        accept=".csv,text/csv"
        className="sr-only"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          setPending(true);
          try {
            const text = await file.text();
            const rows = parseCsv(text).map((row) => ({
              firstName: row.nome || row.firstname || row.first || row.name,
              lastName: row.sobrenome || row.lastname || row.last,
              companyName: row.empresa || row.company,
              email: row.email,
              phone: row.telefone || row.phone,
              whatsapp: row.whatsapp,
              estimatedValue: row.valor || row.value,
            }));
            const result = await importLeadsAction(rows);
            toast.success(`${result.created} lead(s) importado(s)`);
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Não foi possível importar o CSV.");
          } finally {
            setPending(false);
          }
        }}
      />
      <Button type="button" variant="outline" asChild>
        <span>{pending ? "Importando..." : "Importar CSV"}</span>
      </Button>
    </label>
  );
}
