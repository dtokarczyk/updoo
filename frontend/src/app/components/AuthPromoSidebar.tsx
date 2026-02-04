"use client";

import { useState, useEffect } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import { AuthButtons } from "@/app/components/AuthButtons";
import { useTranslations } from "@/hooks/useTranslations";
import { getUserLocale, type Locale } from "@/lib/i18n";
import { t as translate } from "@/lib/translations";

interface AuthPromoSidebarProps {
  /** Initial locale from server to avoid hydration mismatch */
  initialLocale?: Locale;
}

export function AuthPromoSidebar({ initialLocale }: AuthPromoSidebarProps) {
  const { locale: clientLocale } = useTranslations();

  // Use initialLocale from server during SSR to avoid hydration mismatch
  // After hydration, use client locale which may differ if user preferences changed
  const [locale, setLocaleState] = useState<Locale>(initialLocale ?? clientLocale);

  // Update locale after mount if client locale differs from initial locale
  useEffect(() => {
    const currentLocale = getUserLocale();
    if (currentLocale !== initialLocale) {
      setLocaleState(currentLocale);
    }
  }, [initialLocale]);

  // Use server locale for translations during SSR, client locale after mount
  const t = (key: string, params?: Record<string, string | number>) => {
    return translate(locale, key, params);
  };

  return (
    <>
      {/* Theme and language toggles above the container */}
      <div className="flex items-center justify-end gap-2 mb-4">
        <LanguageToggle initialLocale={initialLocale} iconOnly className="h-[44px] w-[44px] px-0" />
        <ThemeToggle className="h-[44px] w-[44px] px-0" />
      </div>

      <div className="rounded-2xl border p-6 shadow-sm ">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          {t("auth.promoTitle")}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("auth.promoDescription")}
        </p>
        <div className="mt-4">
          <AuthButtons initialLocale={initialLocale} />
        </div>
      </div>
    </>
  );
}

