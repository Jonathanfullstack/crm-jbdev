import { z } from "zod";

export const opportunitySchema = z.object({
  title: z.string().min(1, "Informe o título."),
  leadId: z.string().min(1),
  productId: z.string().optional().nullable(),
  value: z.coerce.number().min(0).optional().nullable(),
  stageId: z.string().optional().nullable(),
  probability: z.coerce.number().min(0).max(100).optional().nullable(),
  ownerId: z.string().optional().nullable(),
  expectedClose: z.string().optional().nullable(),
});

export const proposalItemSchema = z.object({
  name: z.string().min(1),
  quantity: z.coerce.number().min(0.01),
  unitPrice: z.coerce.number().min(0),
});

export const proposalSchema = z.object({
  leadId: z.string().min(1),
  opportunityId: z.string().optional().nullable(),
  title: z.string().min(1).optional().nullable(),
  value: z.coerce.number().min(0).optional().nullable(),
  description: z.string().optional().nullable(),
  items: z.array(proposalItemSchema).optional(),
  sentAt: z.string().optional().nullable(),
  validUntil: z.string().optional().nullable(),
  status: z.enum(["DRAFT", "SENT", "VIEWED", "ACCEPTED", "REJECTED"]).default("DRAFT"),
});

export const proposalStatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["DRAFT", "SENT", "VIEWED", "ACCEPTED", "REJECTED"]),
});

export const opportunityStatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["OPEN", "WON", "LOST"]),
  lostReasonId: z.string().optional().nullable(),
  lostNotes: z.string().optional().nullable(),
});
