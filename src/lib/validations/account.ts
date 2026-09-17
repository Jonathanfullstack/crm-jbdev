import { z } from "zod";

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Informe a senha atual."),
  newPassword: z.string().min(6, "A nova senha precisa ter ao menos 6 caracteres."),
});
