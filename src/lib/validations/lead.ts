import { z } from "zod";

export const leadSchema = z.object({
  firstName: z.string().min(1, "Informe o nome."),
  lastName: z.string().optional().nullable(),
  companyName: z.string().optional().nullable(),
  companyId: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  email: z
    .string()
    .email("E-mail inválido.")
    .optional()
    .or(z.literal(""))
    .nullable(),
  jobTitle: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  sourceId: z.string().optional().nullable(),
  stageId: z.string().optional().nullable(),
  ownerId: z.string().optional().nullable(),
  estimatedValue: z.coerce.number().min(0).optional().nullable(),
  probability: z.coerce.number().min(0).max(100).optional().nullable(),
  interest: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  tagIds: z.array(z.string()).optional(),
});

export const moveLeadSchema = z.object({
  leadId: z.string().min(1),
  stageId: z.string().min(1),
  lostReasonId: z.string().optional().nullable(),
  lostNotes: z.string().optional().nullable(),
});

export const reassignLeadSchema = z.object({
  leadId: z.string().min(1),
  ownerId: z.string().min(1).nullable(),
});

export type LeadInput = z.infer<typeof leadSchema>;
