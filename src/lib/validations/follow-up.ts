import { z } from "zod";

export const followUpSchema = z.object({
  leadId: z.string().min(1, "Selecione um lead."),
  ownerId: z.string().min(1, "Selecione o responsável."),
  type: z.enum(["CALL", "WHATSAPP", "EMAIL", "MEETING", "RETURN", "TASK", "OTHER"]),
  description: z.string().optional().nullable(),
  dueAt: z.string().min(1, "Informe data e hora."),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
});

export type FollowUpInput = z.infer<typeof followUpSchema>;
