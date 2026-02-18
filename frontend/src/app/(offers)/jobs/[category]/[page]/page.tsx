import type { Metadata } from 'next';
import { getLocaleFromRequest } from '@/lib/i18n';
import {
  getMetadataConfig,
  getDefaultOpenGraph,
  allCategoriesLabelByLocale,
} from '@/lib/metadata-config';
import { getCategoriesServer } from '@/lib/categories-server';
import { OffersPageLayout } from '@/components/OffersPageLayout';
export const revalidate = 300;

function parsePageParam(raw: string | undefined): number {
  const n = raw ? Number.parseInt(raw, 10) : 1;
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function parseSearchParams(resolved: { skills?: string }): {
  initialSkillIds: string[];
} {
  const rawSkills = resolved.skills;

  const initialSkillIds = rawSkills
    ? rawSkills
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean)
    : [];

  return { initialSkillIds };
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

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://hoplo.pl';
  const path = `/jobs/${categorySlug}/${pageParam}`;
  return {
    title: meta.title,
    description: meta.description,
    openGraph: {
      ...getDefaultOpenGraph(baseUrl, path),
      title: meta.title,
      description: meta.description,
    },
  };
}

export default async function OffersPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string; page: string }>;
  searchParams: Promise<{ skills?: string }>;
}) {
  const { category: categoryParam, page: pageParam } = await params;
  const categorySlug =
    typeof categoryParam === 'string' && categoryParam.length > 0
      ? categoryParam
      : 'all';
  const page = parsePageParam(pageParam);

  const categories = await getCategoriesServer();
  const locale = await getLocaleFromRequest();
  const resolvedSearch = await searchParams;
  const { initialSkillIds } = parseSearchParams(resolvedSearch);

  const isHomePage = categorySlug === 'all' && page === 1;

  return (
    <OffersPageLayout
      categories={categories}
      initialLocale={locale}
      categorySlug={categorySlug}
      page={page}
      initialSkillIds={initialSkillIds}
      isHomePage={isHomePage}
    />
  );
}
