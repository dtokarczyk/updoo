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

  // Use only site-set preference (cookie/localStorage), not profile
  const storedBrowserLocale = getStoredBrowserLocale();
  if (storedBrowserLocale) return storedBrowserLocale;

  // On first visit, detect browser language and store it
  const browserLocale = detectBrowserLocale();
  setStoredBrowserLocale(browserLocale);
  return browserLocale;
}

/**
 * Sets the locale preference. Stored only by the site (cookie + localStorage), not in user profile.
 * Cookie is used for server-side rendering.
 */
export async function setLocale(locale: Locale): Promise<void> {
  if (typeof window === "undefined") return;

  // Set cookie for server-side rendering (expires in 1 year)
  document.cookie = `locale=${locale}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`;
  // Store in localStorage so client-side getUserLocale() uses it
  setStoredBrowserLocale(locale);
}

export function getLocaleFromUserLanguage(language: "POLISH" | "ENGLISH"): Locale {
  return language === "ENGLISH" ? "en" : "pl";
}

export function getUserLanguageFromLocale(locale: Locale): "POLISH" | "ENGLISH" {
  return locale === "en" ? "ENGLISH" : "POLISH";
}

/**
 * Gets locale from cookies or Accept-Language header on the server side.
 * Priority: cookie > Accept-Language header > default "pl".
 * 
 * This function should be used in Server Components to get the locale
 * that matches what the client will use, avoiding hydration mismatches.
 * 
 * Note: This function must be called from a Server Component context.
 * It will throw an error if called from a Client Component.
 */
export async function getLocaleFromRequest(): Promise<Locale> {
  if (typeof window !== "undefined") {
    // On client, use getUserLocale instead
    return getUserLocale();
  }

  // Server-side: import cookies and headers
  // Note: In newer Next.js versions `cookies()` and `headers()` are async.
  // We use `await` with a loose `any` cast to support both sync and async
  // implementations without fighting type overloads.
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = (await (cookies() as any)) as {
      get?: (name: string) => { value?: string } | undefined;
    };
    const cookieLocale = cookieStore.get?.("locale")?.value;
    if (cookieLocale === "pl" || cookieLocale === "en") {
      return cookieLocale;
    }
  } catch {
    // Ignore and continue to header-based detection
  }

  try {
    const { headers } = await import("next/headers");
    const headersList = (await (headers() as any)) as {
      get?: (name: string) => string | null | undefined;
    };
    const acceptLanguage = headersList.get?.("accept-language");
    if (acceptLanguage) {
      const langCode = acceptLanguage.toLowerCase().split("-")[0];
      if (langCode === "en") return "en";
      if (langCode === "pl") return "pl";
    }
  } catch {
    // Ignore and use default
  }

  return defaultLocale;
}
