import type { Locale } from "./i18n";
import plTranslations from "../locales/pl.json";
import enTranslations from "../locales/en.json";

type Translations = typeof plTranslations;

const translations: Record<Locale, Translations> = {
  pl: plTranslations,
  en: enTranslations,
};

export function getTranslations(locale: Locale): Translations {
  return translations[locale] || translations.pl;
}

export function t(locale: Locale, key: string, params?: Record<string, string | number>): string {
  const keys = key.split(".");
  let value: any = getTranslations(locale);

  for (const k of keys) {
    if (value && typeof value === "object" && k in value) {
      value = value[k];
    } else {
      return key; // Return key if translation not found
    }
  }

  if (typeof value !== "string") {
    return key;
  }

  // Replace parameters
  if (params) {
    return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
      return params[paramKey]?.toString() || match;
    });
  }

  return value;
}
