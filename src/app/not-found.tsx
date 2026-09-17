import Link from "next/link";
import { BrandMark } from "@/components/brand/brand-mark";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <BrandMark name="CRM" />
      <h1 className="text-2xl font-semibold tracking-tight">Página não encontrada</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Esse endereço não existe ou você não tem acesso.
      </p>
      <Button asChild>
        <Link href="/">Voltar</Link>
      </Button>
    </div>
  );
}
