import { z } from "zod";

export const taskSchema = z.object({
  title: z.string().min(1, "Informe o título."),
  description: z.string().optional().nullable(),
  ownerId: z.string().min(1, "Selecione o responsável."),
  leadId: z.string().optional().nullable(),
  dueAt: z.string().optional().nullable(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  status: z.enum(["PENDING", "IN_PROGRESS", "DONE"]).default("PENDING"),
});

export type TaskInput = z.infer<typeof taskSchema>;
