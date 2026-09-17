import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(1, "Informe o nome."),
  description: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  price: z.coerce.number().min(0).optional().nullable(),
  isActive: z.boolean().default(true),
});
