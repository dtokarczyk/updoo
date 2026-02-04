"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import { AuthButtons } from "@/app/components/AuthButtons";
import { useTranslations } from "@/hooks/useTranslations";
import { getUserLocale, type Locale } from "@/lib/i18n";
import { t as translate } from "@/lib/translations";
import {
  DrawerClose,
  DrawerContent,
  DrawerHeader,
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
        <div className="flex items-center justify-end">
          <DrawerClose asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </DrawerClose>
        </div>
      </DrawerHeader>

      <div className="flex-1 overflow-y-auto p-6">
        {/* Theme and language toggles above the container (same as sidebar) */}
        <div className="flex items-center justify-end gap-2 mb-4">
          <LanguageToggle initialLocale={initialLocale} iconOnly className="h-[44px] w-[44px] px-0" />
          <ThemeToggle className="h-[44px] w-[44px] px-0" />
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            {t("auth.promoTitle")}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("auth.promoDescription")}
          </p>
          <div className="mt-4">
            <AuthButtons initialLocale={initialLocale} onButtonClick={onClose} />
          </div>
        </div>
      </div>
    </DrawerContent>
  );
}
