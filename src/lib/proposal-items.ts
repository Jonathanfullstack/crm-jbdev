export type ProposalLineItem = {
  name: string;
  quantity: number;
  unitPrice: number;
};

export function parseProposalItems(value: unknown): ProposalLineItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const name = String(row.name ?? "").trim();
      const quantity = Number(row.quantity);
      const unitPrice = Number(row.unitPrice);
      if (!name || !Number.isFinite(quantity) || !Number.isFinite(unitPrice)) return null;
      return { name, quantity, unitPrice };
    })
    .filter((item): item is ProposalLineItem => Boolean(item));
}

export function proposalItemsTotal(items: ProposalLineItem[]) {
  return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
}
