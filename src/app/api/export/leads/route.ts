import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { listLeads } from "@/lib/queries/leads";
import { toCsv } from "@/lib/csv";
import { fullName } from "@/lib/utils";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const leads = await listLeads(user);
  const csv = toCsv(
    leads.map((lead) => ({
      nome: fullName(lead.firstName, lead.lastName),
      empresa: lead.companyName,
      email: lead.email,
      telefone: lead.phone,
      whatsapp: lead.whatsapp,
      origem: lead.source?.name,
      etapa: lead.stage.name,
      responsavel: lead.owner?.name,
      valor: lead.estimatedValue,
      status: lead.kind === "CLIENT" ? "Cliente" : "Lead",
    })),
  );

  return new NextResponse(`\uFEFF${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="leads.csv"',
    },
  });
}
