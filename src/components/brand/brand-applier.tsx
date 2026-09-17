"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import { hexToHsl } from "@/lib/utils";
import { themeToNextTheme, type WorkspaceBrand } from "@/lib/branding";

export function BrandApplier({ brand }: { brand: WorkspaceBrand }) {
  const { setTheme } = useTheme();

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--primary", hexToHsl(brand.primaryColor));
    if (brand.secondaryColor) {
      root.style.setProperty("--secondary", hexToHsl(brand.secondaryColor));
    }
    setTheme(themeToNextTheme(brand.theme));

    const favicon = brand.faviconUrl || "/favicon.svg";
    let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = favicon;
  }, [brand.faviconUrl, brand.primaryColor, brand.secondaryColor, brand.theme, setTheme]);

  return null;
}
