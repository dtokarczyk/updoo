"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/hooks/useTranslations";
import { setLocale, getUserLocale, type Locale } from "@/lib/i18n";
import { t as translate } from "@/lib/translations";
import ReactCountryFlag from "react-country-flag";

interface LanguageToggleProps {
  className?: string;
  size?: "default" | "sm" | "lg" | "icon" | "icon-sm" | "icon-lg";
  /** Show full language names (English/Polish) instead of codes (EN/PL) */
  showFullName?: boolean;
  /** Initial locale from server to avoid hydration mismatch */
  initialLocale?: Locale;
}

export function LanguageToggle({
  className,
  size = "icon-sm",
  showFullName = false,
  initialLocale
}: LanguageToggleProps) {
  const { locale: clientLocale, t: clientT } = useTranslations();

  // Use initialLocale from server during SSR to avoid hydration mismatch
  // After hydration, use client locale which may differ if user preferences changed
  const [locale, setLocaleState] = useState<Locale>(initialLocale ?? clientLocale);
  const [mounted, setMounted] = useState(false);

  // Update locale after mount if client locale differs from initial locale
  useEffect(() => {
    setMounted(true);
    const currentLocale = getUserLocale();
    if (currentLocale !== initialLocale) {
      setLocaleState(currentLocale);
    }
  }, [initialLocale]);

  // Use server locale for translations during SSR, client locale after mount
  const t = (key: string, params?: Record<string, string | number>) => {
    return translate(locale, key, params);
  };

  const toggleLanguage = async () => {
    const nextLocale: Locale = locale === "pl" ? "en" : "pl";
    await setLocale(nextLocale);
    // Reload the entire page to ensure all server components use the new locale
    window.location.reload();
  };

  const nextLocale: Locale = locale === "pl" ? "en" : "pl";
  const nextFlag = nextLocale === "pl" ? "PL" : "GB";
  const displayText = showFullName
    ? (nextLocale === "pl" ? t("listings.polish") : t("listings.english"))
    : nextLocale.toUpperCase();

  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      onClick={toggleLanguage}
      className={cn("shrink-0 gap-1.5 cursor-pointer", className)}
      aria-label={t("common.changeLanguage")}
      title={`${t("common.changeLanguage")} (${nextLocale.toUpperCase()})`}
      suppressHydrationWarning
    >
      <ReactCountryFlag
        svg
        countryCode={nextFlag}
        style={{ width: "1em", height: "1em" }}
        aria-hidden
      />
      <span className={showFullName ? "text-sm font-medium" : "text-xs font-medium"} suppressHydrationWarning>
        {displayText}
      </span>
    </Button>
  );
}
