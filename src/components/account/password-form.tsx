"use client";

import { useState } from "react";
import { toast } from "sonner";
import { changePasswordAction } from "@/actions/account";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PasswordForm() {
  const [pending, setPending] = useState(false);

  return (
    <form
      className="grid max-w-md gap-3"
      action={async (formData) => {
        setPending(true);
        try {
          await changePasswordAction({
            currentPassword: String(formData.get("currentPassword") ?? ""),
            newPassword: String(formData.get("newPassword") ?? ""),
          });
          toast.success("Senha atualizada");
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Não foi possível alterar a senha.");
        } finally {
          setPending(false);
        }
      }}
    >
      <div className="space-y-2">
        <Label htmlFor="currentPassword">Senha atual</Label>
        <Input id="currentPassword" name="currentPassword" type="password" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="newPassword">Nova senha</Label>
        <Input id="newPassword" name="newPassword" type="password" minLength={6} required />
      </div>
      <Button type="submit" className="w-fit" disabled={pending}>
        {pending ? "Salvando..." : "Alterar senha"}
      </Button>
    </form>
  );
}
