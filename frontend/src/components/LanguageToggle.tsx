"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/hooks/useTranslations";
import { setLocale, type Locale } from "@/lib/i18n";
import ReactCountryFlag from "react-country-flag";

interface LanguageToggleProps {
  className?: string;
  size?: "default" | "sm" | "lg" | "icon" | "icon-sm" | "icon-lg";
  /** Show full language names (English/Polish) instead of codes (EN/PL) */
  showFullName?: boolean;
}

export function LanguageToggle({ className, size = "icon-sm", showFullName = false }: LanguageToggleProps) {
  const { locale, t } = useTranslations();
  const router = useRouter();

  const toggleLanguage = async () => {
    const nextLocale: Locale = locale === "pl" ? "en" : "pl";
    await setLocale(nextLocale);
    router.refresh();
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
    >
      <ReactCountryFlag
        svg
        countryCode={nextFlag}
        style={{ width: "1em", height: "1em" }}
        aria-hidden
      />
      <span className={showFullName ? "text-sm font-medium" : "text-xs font-medium"}>{displayText}</span>
    </Button>
  );
}
