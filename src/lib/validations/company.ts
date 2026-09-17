import { z } from "zod";

export const companySchema = z.object({
  legalName: z.string().min(1, "Informe a razão social."),
  tradeName: z.string().optional().nullable(),
  document: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  website: z.string().optional().nullable(),
  segment: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
});
