import { redirect } from "next/navigation";
import { completeOnboardingAction, skipOnboardingAction } from "@/actions/onboarding";
import { BrandMark } from "@/components/brand/brand-mark";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { getSessionUser } from "@/lib/auth/session";
import { NEUTRAL_BRAND } from "@/lib/branding";

export default async function OnboardingPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.workspace.onboardingDone) redirect("/");

  async function submit(formData: FormData) {
    "use server";
    await completeOnboardingAction({
      companyName: String(formData.get("companyName")),
      logoUrl: String(formData.get("logoUrl") ?? ""),
      primaryColor: String(formData.get("primaryColor") || NEUTRAL_BRAND.primaryColor),
      theme: String(formData.get("theme") || "SYSTEM"),
    });
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <Card className="w-full max-w-xl">
        <CardHeader className="space-y-3">
          <BrandMark name="CRM" />
          <div>
            <CardTitle>Deixe o CRM com a cara da sua empresa</CardTitle>
            <CardDescription>Nome, logo, cor e tema. Você pode pular e configurar depois.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Nome da empresa</Label>
              <Input id="companyName" name="companyName" required placeholder="Nome da sua empresa" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="logoUrl">Logo (URL)</Label>
              <Input id="logoUrl" name="logoUrl" placeholder="https://" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="primaryColor">Cor principal</Label>
                <Input id="primaryColor" name="primaryColor" type="color" defaultValue={NEUTRAL_BRAND.primaryColor} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="theme">Tema</Label>
                <NativeSelect id="theme" name="theme" defaultValue="SYSTEM">
                  <option value="LIGHT">Claro</option>
                  <option value="DARK">Escuro</option>
                  <option value="SYSTEM">Sistema</option>
                </NativeSelect>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2">
              <Button formAction={skipOnboardingAction} type="submit" variant="ghost">
                Pular
              </Button>
              <Button type="submit">Concluir</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
