"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/hooks/useTranslations";
import { LanguageToggle } from "@/components/LanguageToggle";
import { getUserLocale, type Locale } from "@/lib/i18n";
import { t as translate } from "@/lib/translations";

export function AuthBottomBar({ initialLocale }: { initialLocale: Locale }) {
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
    <div className="fixed inset-x-0 bottom-0 z-[100] border-t border-border bg-background/95 px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] backdrop-blur lg:hidden w-full max-w-full overflow-x-hidden">
      <div className="mx-auto flex max-w-4xl items-center gap-3 w-full max-w-full overflow-x-hidden">
        <p className="flex-1 text-xs text-muted-foreground">
          {t("auth.promoBarText")}
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <LanguageToggle size="sm" initialLocale={initialLocale} />
          <Button asChild variant="outline" size="sm">
            <Link href="/login">{t("auth.logIn")}</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/register">{t("auth.register")}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

