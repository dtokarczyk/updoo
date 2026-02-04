"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
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
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
      <h2 className="text-lg font-semibold tracking-tight text-foreground">
        {t("auth.promoTitle")}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {t("auth.promoDescription")}
      </p>
      <div className="mt-4 space-y-2">
        <Button asChild className="w-full">
          <Link href="/register">{t("auth.signUp")}</Link>
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          {t("auth.alreadyHaveAccountText")}
        </p>
        <Button asChild variant="outline" className="w-full">
          <Link href="/login">{t("auth.signIn")}</Link>
        </Button>
      </div>
    </div>
  );
}

