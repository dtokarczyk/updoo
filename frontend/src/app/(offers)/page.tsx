import type { Metadata } from 'next';
import { getLocaleFromRequest } from '@/lib/i18n';
import { getMetadataConfig } from '@/lib/metadata-config';
import { getCategoriesServer } from '@/lib/categories-server';
import { OffersPageLayout } from '@/components/OffersPageLayout';
import type { JobLanguage } from '@/lib/api';

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocaleFromRequest();
  const meta = getMetadataConfig(locale).home;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://hoplo.pl';
  return {
    metadataBase: new URL(baseUrl),
    title: meta.title,
    description: meta.description,
    openGraph: {
      title: meta.title,
      description: meta.description,
      type: 'website',
    },
  };
}

function parseSearchParams(searchParams: {
  language?: string;
  skills?: string;
}): { initialLanguage?: JobLanguage; initialSkillIds: string[] } {
  const languageParam = searchParams.language;
  const rawSkills = searchParams.skills;

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

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ language?: string; skills?: string }>;
}) {
  const categories = await getCategoriesServer();
  const locale = await getLocaleFromRequest();
  const resolved = await searchParams;
  const { initialLanguage, initialSkillIds } = parseSearchParams(resolved);

  return (
    <OffersPageLayout
      categories={categories}
      initialLocale={locale}
      categorySlug="all"
      page={1}
      initialLanguage={initialLanguage}
      initialSkillIds={initialSkillIds}
      isHomePage
    />
  );
}
