export const NEUTRAL_BRAND = {
  name: "CRM",
  logoUrl: null as string | null,
  faviconUrl: null as string | null,
  primaryColor: "#475569",
  secondaryColor: null as string | null,
  theme: "SYSTEM" as const,
  showDeveloperCredit: false,
};

export type WorkspaceBrand = {
  name: string;
  slug?: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string;
  secondaryColor: string | null;
  theme: "LIGHT" | "DARK" | "SYSTEM";
  showDeveloperCredit: boolean;
};

export function resolveBrand(input?: Partial<WorkspaceBrand> | null): WorkspaceBrand {
  return {
    name: input?.name?.trim() || NEUTRAL_BRAND.name,
    slug: input?.slug ?? null,
    logoUrl: input?.logoUrl || null,
    faviconUrl: input?.faviconUrl || null,
    primaryColor: input?.primaryColor || NEUTRAL_BRAND.primaryColor,
    secondaryColor: input?.secondaryColor || null,
    theme: input?.theme ?? NEUTRAL_BRAND.theme,
    showDeveloperCredit: input?.showDeveloperCredit ?? false,
  };
}

export function themeToNextTheme(theme: WorkspaceBrand["theme"]) {
  if (theme === "LIGHT") return "light";
  if (theme === "DARK") return "dark";
  return "system";
}

export const USER_THEME_STORAGE_KEY = "crm-theme";
