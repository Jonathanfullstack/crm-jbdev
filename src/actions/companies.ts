"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireSessionUser } from "@/lib/auth/session";
import { companySchema } from "@/lib/validations/company";

export async function createCompanyAction(input: unknown) {
  const user = await requireSessionUser();
  const parsed = companySchema.parse(input);

  const company = await db.company.create({
    data: {
      workspaceId: user.workspaceId,
      legalName: parsed.legalName.trim(),
      tradeName: parsed.tradeName || null,
      document: parsed.document || null,
      phone: parsed.phone || null,
      email: parsed.email || null,
      website: parsed.website || null,
      segment: parsed.segment || null,
      city: parsed.city || null,
      state: parsed.state || null,
    },
  });

  revalidatePath("/companies");
  return { id: company.id };
}
