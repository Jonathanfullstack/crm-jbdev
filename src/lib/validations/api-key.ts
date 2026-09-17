import { z } from "zod";

export const apiKeySchema = z.object({
  name: z.string().min(1, "Informe um nome para a chave."),
});
