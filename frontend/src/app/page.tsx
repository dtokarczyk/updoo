import { getLocaleFromRequest } from "@/lib/i18n";
import { getCategoriesServer } from "@/lib/categories-server";
import { OffersPageClient } from "@/app/jobs/[category]/[page]/OffersPageClient";

export default async function Home() {
  const categories = await getCategoriesServer();
  const locale = await getLocaleFromRequest();
  return <OffersPageClient categories={categories} initialLocale={locale} />;
}
