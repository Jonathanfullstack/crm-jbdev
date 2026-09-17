"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export function GlobalSearch() {
  const router = useRouter();
  const [value, setValue] = useState("");

  return (
    <form
      className="relative hidden w-full max-w-md md:block"
      onSubmit={(event) => {
        event.preventDefault();
        if (!value.trim()) return;
        router.push(`/leads?q=${encodeURIComponent(value.trim())}`);
      }}
    >
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Buscar leads, clientes, empresas, telefone ou e-mail"
        className="pl-9"
        aria-label="Busca global"
      />
    </form>
  );
}
