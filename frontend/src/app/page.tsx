import type { Metadata } from "next";
import { getLocaleFromRequest } from "@/lib/i18n";
import { getMetadataConfig } from "@/lib/metadata-config";
import { getCategoriesServer } from "@/lib/categories-server";
import { OffersPageClient } from "@/app/jobs/[category]/[page]/OffersPageClient";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocaleFromRequest();
  const meta = getMetadataConfig(locale).home;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://oferi.pl";
  return {
    metadataBase: new URL(baseUrl),
    title: meta.title,
    description: meta.description,
    openGraph: {
      title: meta.title,
      description: meta.description,
      type: "website",
    },
  };
}

export default async function Home() {
  const categories = await getCategoriesServer();
  const locale = await getLocaleFromRequest();
  return <OffersPageClient categories={categories} initialLocale={locale} />;
}
