import type { Metadata } from 'next';
import { SettingsLayout } from '@/layouts/SettingsLayout';
import { getLocaleFromRequest } from '@/lib/i18n';
import { getMetadataConfig, getDefaultOpenGraph } from '@/lib/metadata-config';
import { requireAuth } from '@/lib/auth-server';
import { Sidebar } from './sidebar';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocaleFromRequest();
  const meta = getMetadataConfig(locale).my;
  return {
    title: meta.title,
    description: meta.description,
    robots: 'noindex, nofollow',
    openGraph: {
      ...getDefaultOpenGraph(
        process.env.NEXT_PUBLIC_APP_URL ?? 'https://hoplo.pl',
        '/my',
      ),
      title: meta.title,
      description: meta.description,
    },
  };
}

export default async function MyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();

  return (
    <SettingsLayout sidebar={<Sidebar variant="sidebar" />}>
      {children}
    </SettingsLayout>
  );
}
