import Link from "next/link";
import { notFound } from "next/navigation";
import { ProposalDocument } from "@/components/proposals/proposal-document";
import { PrintButton } from "@/components/shared/print-button";
import { Button } from "@/components/ui/button";
import { getSessionUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { serializeDecimal } from "@/lib/utils";
import { leadVisibilityWhere } from "@/lib/scope";

export default async function ProposalPrintPage({ params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return null;

  const proposal = await db.proposal.findFirst({
    where: { id: params.id, workspaceId: user.workspaceId, lead: leadVisibilityWhere(user) },
    include: { lead: true },
  });
  if (!proposal) notFound();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <Button asChild variant="outline">
          <Link href="/proposals">Voltar</Link>
        </Button>
        <PrintButton />
      </div>
      <ProposalDocument
        brand={{
          name: user.workspace.name,
          logoUrl: user.workspace.logoUrl,
          email: user.workspace.email,
          phone: user.workspace.phone,
          website: user.workspace.website,
        }}
        proposal={{
          title: proposal.title,
          value: serializeDecimal(proposal.value) ?? 0,
          description: proposal.description,
          items: proposal.items,
          status: proposal.status,
          sentAt: proposal.sentAt,
          validUntil: proposal.validUntil,
          createdAt: proposal.createdAt,
        }}
        lead={proposal.lead}
      />
    </div>
  );
}
