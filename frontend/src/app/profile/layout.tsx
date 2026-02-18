import type { Metadata } from 'next';
import { getLocaleFromRequest } from '@/lib/i18n';
import { getMetadataConfig, getDefaultOpenGraph } from '@/lib/metadata-config';
import { requireAuth } from '@/lib/auth-server';
import { ProfileSidebar } from './ProfileSidebar';
import { SettingsLayout } from '@/layouts/SettingsLayout';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocaleFromRequest();
  const meta = getMetadataConfig(locale).profileEdit;
  return {
    title: meta.title,
    description: meta.description,
    robots: 'noindex, nofollow',
    openGraph: {
      ...getDefaultOpenGraph(process.env.NEXT_PUBLIC_APP_URL ?? 'https://hoplo.pl', '/profile'),
      title: meta.title,
      description: meta.description,
    },
  };
}

export default async function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();

  return (
    <SettingsLayout sidebar={<ProfileSidebar variant="sidebar" />}>
      {children}
    </SettingsLayout>
  );
}
