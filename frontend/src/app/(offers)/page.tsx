import type { Metadata } from 'next';
import { getLocaleFromRequest } from '@/lib/i18n';
import { getMetadataConfig } from '@/lib/metadata-config';
import { getCategoriesServer } from '@/lib/categories-server';
import { OffersPageLayout } from '@/components/OffersPageLayout';
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
  skills?: string;
}): { initialSkillIds: string[] } {
  const rawSkills = searchParams.skills;

  const initialSkillIds = rawSkills
    ? rawSkills
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean)
    : [];

  return { initialSkillIds };
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ skills?: string }>;
}) {
  const categories = await getCategoriesServer();
  const locale = await getLocaleFromRequest();
  const resolved = await searchParams;
  const { initialSkillIds } = parseSearchParams(resolved);

  return (
    <OffersPageLayout
      categories={categories}
      initialLocale={locale}
      categorySlug="all"
      page={1}
      initialSkillIds={initialSkillIds}
      isHomePage
    />
  );
}
