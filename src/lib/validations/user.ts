import { z } from "zod";

export const userSchema = z.object({
  name: z.string().min(1, "Informe o nome."),
  email: z.string().email("E-mail inválido."),
  password: z.string().min(6, "A senha precisa ter ao menos 6 caracteres.").optional(),
  role: z.enum(["ADMIN", "MANAGER", "SELLER"]),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export type UserInput = z.infer<typeof userSchema>;
