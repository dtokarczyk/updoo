import { getStoredUser } from "./api";

export type Locale = "pl" | "en";

export const locales: Locale[] = ["pl", "en"];
export const defaultLocale: Locale = "pl";

export function getUserLocale(): Locale {
  if (typeof window === "undefined") return defaultLocale;
  const user = getStoredUser();
  if (user?.language === "ENGLISH") return "en";
  return "pl";
}

export function getLocaleFromUserLanguage(language: "POLISH" | "ENGLISH"): Locale {
  return language === "ENGLISH" ? "en" : "pl";
}

export function getUserLanguageFromLocale(locale: Locale): "POLISH" | "ENGLISH" {
  return locale === "en" ? "ENGLISH" : "POLISH";
}
