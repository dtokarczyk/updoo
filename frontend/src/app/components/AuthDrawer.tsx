"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/hooks/useTranslations";
import { getUserLocale, type Locale } from "@/lib/i18n";
import { t as translate } from "@/lib/translations";
import {
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { X } from "lucide-react";

interface AuthDrawerContentProps {
  /** Initial locale from server to avoid hydration mismatch */
  initialLocale?: Locale;
  onClose: () => void;
}

export function AuthDrawerContent({ initialLocale, onClose }: AuthDrawerContentProps) {
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
    <DrawerContent className="h-full max-w-sm">
      <DrawerHeader className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <DrawerTitle>{t("auth.promoTitle")}</DrawerTitle>
          <DrawerClose asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </DrawerClose>
        </div>
      </DrawerHeader>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
          <div className="mt-2 space-y-4">
            <h2 className="text-xl font-semibold">{t("auth.dontHaveAccount")}</h2>
            <Button asChild variant="secondary" size="lg" className="w-full" onClick={() => onClose()}>
              <Link href="/register">{t("auth.register")}</Link>
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              {t("auth.alreadyHaveAccountText")}
            </p>
            <Button asChild className="w-full" onClick={() => onClose()}>
              <Link href="/login">{t("auth.signIn")}</Link>
            </Button>
          </div>
        </div>
      </div>
    </DrawerContent>
  );
}
