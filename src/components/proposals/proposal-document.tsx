import { formatCurrency, formatDate } from "@/lib/format";
import { parseProposalItems, proposalItemsTotal } from "@/lib/proposal-items";
import { fullName } from "@/lib/utils";
import { proposalStatusLabel } from "@/lib/labels";

type ProposalDocumentProps = {
  brand: { name: string; logoUrl: string | null; email: string | null; phone: string | null; website: string | null };
  proposal: {
    title: string;
    value: number;
    description: string | null;
    items: unknown;
    status: keyof typeof proposalStatusLabel;
    sentAt: Date | null;
    validUntil: Date | null;
    createdAt: Date;
  };
  lead: {
    firstName: string;
    lastName: string | null;
    companyName: string | null;
    email: string | null;
    phone: string | null;
  };
};

export function ProposalDocument({ brand, proposal, lead }: ProposalDocumentProps) {
  const items = parseProposalItems(proposal.items);
  const total = items.length ? proposalItemsTotal(items) : proposal.value;

  return (
    <article className="mx-auto max-w-3xl rounded-xl border bg-white p-8 text-zinc-950 shadow-soft print:border-0 print:shadow-none">
      <header className="flex items-start justify-between gap-6 border-b pb-6">
        <div>
          {brand.logoUrl ? (
            // External workspace logos are configured per tenant.
            <img src={brand.logoUrl} alt={brand.name} className="mb-3 h-10 w-auto" />
          ) : null}
          <p className="text-sm font-semibold">{brand.name}</p>
          <p className="text-xs text-zinc-500">
            {[brand.email, brand.phone, brand.website].filter(Boolean).join(" · ")}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Proposta comercial</p>
          <h1 className="text-2xl font-semibold tracking-tight">{proposal.title}</h1>
          <p className="mt-1 text-sm text-zinc-500">{proposalStatusLabel[proposal.status]}</p>
        </div>
      </header>

      <section className="mt-6 grid gap-6 sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-wide text-zinc-500">Para</p>
          <p className="font-medium">{fullName(lead.firstName, lead.lastName)}</p>
          <p className="text-sm text-zinc-600">{lead.companyName || "Cliente pessoa física"}</p>
          <p className="text-sm text-zinc-600">{lead.email || lead.phone || "—"}</p>
        </div>
        <div className="sm:text-right">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Datas</p>
          <p className="text-sm">Emissão: {formatDate(proposal.sentAt ?? proposal.createdAt)}</p>
          <p className="text-sm">Validade: {formatDate(proposal.validUntil)}</p>
        </div>
      </section>

      <table className="mt-8 w-full text-sm">
        <thead>
          <tr className="border-b text-left text-zinc-500">
            <th className="py-2 font-medium">Item</th>
            <th className="py-2 font-medium">Qtd</th>
            <th className="py-2 font-medium">Unitário</th>
            <th className="py-2 text-right font-medium">Total</th>
          </tr>
        </thead>
        <tbody>
          {(items.length ? items : [{ name: proposal.title, quantity: 1, unitPrice: proposal.value }]).map(
            (item, index) => (
              <tr key={`${item.name}-${index}`} className="border-b">
                <td className="py-3">{item.name}</td>
                <td className="py-3 tabular-nums">{item.quantity}</td>
                <td className="py-3 tabular-nums">{formatCurrency(item.unitPrice)}</td>
                <td className="py-3 text-right tabular-nums">{formatCurrency(item.quantity * item.unitPrice)}</td>
              </tr>
            ),
          )}
        </tbody>
      </table>

      <div className="mt-6 flex justify-end">
        <p className="text-lg font-semibold tabular-nums">Total {formatCurrency(total)}</p>
      </div>

      {proposal.description ? (
        <section className="mt-8">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Condições</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-700">{proposal.description}</p>
        </section>
      ) : null}

      <footer className="mt-12 border-t pt-4 text-center text-[11px] text-zinc-400">
        Documento gerado pelo CRM · Desenvolvido por JBDev
      </footer>
    </article>
  );
}
