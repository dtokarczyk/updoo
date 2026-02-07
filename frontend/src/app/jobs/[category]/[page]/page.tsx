import type { Metadata } from 'next';
import { OffersPageClient } from './OffersPageClient';
import { getLocaleFromRequest } from '@/lib/i18n';
import {
  getMetadataConfig,
  allCategoriesLabelByLocale,
} from '@/lib/metadata-config';
import { getCategoriesServer } from '@/lib/categories-server';

// Cache the page (and categories) for 60 seconds.
export const revalidate = 60;

function parsePageParam(raw: string | undefined): number {
  const n = raw ? Number.parseInt(raw, 10) : 1;
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; page: string }>;
}): Promise<Metadata> {
  const { category: categorySlug, page: pageParam } = await params;
  const locale = await getLocaleFromRequest();
  const categories = await getCategoriesServer();
  const page = parsePageParam(pageParam);

  const categoryDisplayName =
    categorySlug === 'all' || !categorySlug
      ? allCategoriesLabelByLocale[locale]
      : (categories.find((c) => c.slug === categorySlug)?.name ??
        allCategoriesLabelByLocale[locale]);

  const meta = getMetadataConfig(locale).offersCategory(
    categoryDisplayName,
    page,
  );

  return {
    title: meta.title,
    description: meta.description,
    openGraph: {
      title: meta.title,
      description: meta.description,
    },
  };
}

export default async function OffersPage() {
  const categories = await getCategoriesServer();
  const locale = await getLocaleFromRequest();
  return <OffersPageClient categories={categories} initialLocale={locale} />;
}
