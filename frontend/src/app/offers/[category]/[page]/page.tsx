import { headers } from "next/headers";
import { cookies } from "next/headers";
import { sortCategoriesByOrder, type Category } from "@/lib/api";
import { OffersPageClient } from "./OffersPageClient";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
const LOCALE_COOKIE_NAME = "locale";

// Cache the page (and categories) for 60 seconds.
export const revalidate = 60;

/**
 * Gets locale from cookies or Accept-Language header.
 * Priority: cookie > Accept-Language header > default "pl".
 *
 * Note: In newer Next.js versions `cookies()` and `headers()` are async.
 * We use `await` with a loose `any` cast to support both sync and async
 * implementations without fighting type overloads.
 */
async function getLocaleFromRequest(): Promise<"pl" | "en"> {
  // 1) Try explicit locale cookie set by `setLocale` on the client
  try {
    const cookieStore = (await (cookies() as any)) as {
      get?: (name: string) => { value?: string } | undefined;
    };
    const cookieLocale = cookieStore.get?.(LOCALE_COOKIE_NAME)?.value;
    if (cookieLocale === "pl" || cookieLocale === "en") {
      return cookieLocale;
    }
  } catch {
    // Ignore and continue to header-based detection
  }

  // 2) Fallback to browser Accept-Language header from the incoming request
  try {
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

  // 3) Default when nothing else is available
  return "pl";
}

async function getCategoriesServer(): Promise<Category[]> {
  const locale = await getLocaleFromRequest();

  const res = await fetch(`${API_URL}/listings/categories`, {
    // Revalidate categories periodically so they do not have to be
    // fetched on every client render.
    next: { revalidate },
    headers: {
      "Accept-Language": locale,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch categories");
  }

  const data = (await res.json()) as Category[];
  return sortCategoriesByOrder(data);
}

export default async function OffersPage() {
  const categories = await getCategoriesServer();
  return <OffersPageClient categories={categories} />;
}


