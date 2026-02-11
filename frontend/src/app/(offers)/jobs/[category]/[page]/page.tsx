import type { Metadata } from 'next';
import { getLocaleFromRequest } from '@/lib/i18n';
import {
  getMetadataConfig,
  allCategoriesLabelByLocale,
} from '@/lib/metadata-config';
import { getCategoriesServer } from '@/lib/categories-server';
import { OffersPageLayout } from '@/components/OffersPageLayout';
import type { JobLanguage } from '@/lib/api';

export const revalidate = 300;

function parsePageParam(raw: string | undefined): number {
  const n = raw ? Number.parseInt(raw, 10) : 1;
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function parseSearchParams(resolved: { language?: string; skills?: string }): {
  initialLanguage?: JobLanguage;
  initialSkillIds: string[];
} {
  const languageParam = resolved.language;
  const rawSkills = resolved.skills;

  const initialLanguage =
    languageParam === 'ENGLISH' || languageParam === 'POLISH'
      ? (languageParam as JobLanguage)
      : undefined;

  const initialSkillIds = rawSkills
    ? rawSkills
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean)
    : [];

  return { initialLanguage, initialSkillIds };
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

export default async function OffersPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string; page: string }>;
  searchParams: Promise<{ language?: string; skills?: string }>;
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
  const { initialLanguage, initialSkillIds } =
    parseSearchParams(resolvedSearch);

  const isHomePage = categorySlug === 'all' && page === 1;

  return (
    <OffersPageLayout
      categories={categories}
      initialLocale={locale}
      categorySlug={categorySlug}
      page={page}
      initialLanguage={initialLanguage}
      initialSkillIds={initialSkillIds}
      isHomePage={isHomePage}
    />
  );
}
