import { BrandMark } from "@/components/brand/brand-mark";

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3">
      <BrandMark name="CRM" />
      <p className="text-sm text-muted-foreground">Carregando...</p>
    </div>
  );
}
