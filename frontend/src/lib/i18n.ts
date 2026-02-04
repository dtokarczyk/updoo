import { getStoredUser, updateStoredUser, getToken, updateProfile } from "./api";

export type Locale = "pl" | "en";

export const locales: Locale[] = ["pl", "en"];
export const defaultLocale: Locale = "pl";

const BROWSER_LOCALE_KEY = "browser_locale";

/**
 * Detects browser language and returns appropriate locale.
 * Returns "en" for English variants, "pl" for Polish, otherwise defaultLocale.
 */
function detectBrowserLocale(): Locale {
  if (typeof window === "undefined") return defaultLocale;

  const browserLang = navigator.language || (navigator as any).userLanguage;
  if (!browserLang) return defaultLocale;

  const langCode = browserLang.toLowerCase().split("-")[0];
  if (langCode === "en") return "en";
  if (langCode === "pl") return "pl";

  return defaultLocale;
}

/**
 * Gets the stored browser locale preference from localStorage.
 */
function getStoredBrowserLocale(): Locale | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(BROWSER_LOCALE_KEY);
  if (stored === "pl" || stored === "en") return stored;
  return null;
}

/**
 * Sets the browser locale preference in localStorage.
 */
function setStoredBrowserLocale(locale: Locale): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(BROWSER_LOCALE_KEY, locale);
}

export function getUserLocale(): Locale {
  if (typeof window === "undefined") return defaultLocale;

  // First check if user is logged in and has language preference
  const user = getStoredUser();
  if (user?.language === "ENGLISH") return "en";
  if (user?.language === "POLISH") return "pl";

  // Then check if we've stored browser locale preference
  const storedBrowserLocale = getStoredBrowserLocale();
  if (storedBrowserLocale) return storedBrowserLocale;

  // On first visit, detect browser language and store it
  const browserLocale = detectBrowserLocale();
  setStoredBrowserLocale(browserLocale);
  return browserLocale;
}

/**
 * Sets the locale preference. Updates user profile if logged in, otherwise stores browser preference.
 * Also sets a cookie for server-side rendering.
 */
export async function setLocale(locale: Locale): Promise<void> {
  if (typeof window === "undefined") return;

  const user = getStoredUser();
  const token = getToken();
  const language = getUserLanguageFromLocale(locale);

  // Set cookie for server-side rendering (expires in 1 year)
  document.cookie = `locale=${locale}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`;

  // If user is logged in, update their profile
  if (user && token) {
    try {
      const updated = await updateProfile({ language });
      updateStoredUser(updated.user);
    } catch (error) {
      // If API call fails, still update local storage
      console.error("Failed to update user language:", error);
      const updatedUser = { ...user, language };
      updateStoredUser(updatedUser);
    }
  } else {
    // For non-logged-in users, store browser preference
    setStoredBrowserLocale(locale);
  }
}

export function getLocaleFromUserLanguage(language: "POLISH" | "ENGLISH"): Locale {
  return language === "ENGLISH" ? "en" : "pl";
}

export function getUserLanguageFromLocale(locale: Locale): "POLISH" | "ENGLISH" {
  return locale === "en" ? "ENGLISH" : "POLISH";
}
