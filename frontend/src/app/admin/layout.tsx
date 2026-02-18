import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getLocaleFromRequest } from '@/lib/i18n';
import { getMetadataConfig, getDefaultOpenGraph } from '@/lib/metadata-config';
import { getTokenFromCookies } from '@/lib/auth-server';
import { getProfileServer } from '@/lib/api';
import { SettingsLayout } from '@/layouts/SettingsLayout';
import { AdminSidebar } from './AdminSidebar';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocaleFromRequest();
  const meta = getMetadataConfig(locale).admin;
  return {
    title: meta.title,
    description: meta.description,
    robots: 'noindex, nofollow',
    openGraph: {
      ...getDefaultOpenGraph(process.env.NEXT_PUBLIC_APP_URL ?? 'https://hoplo.pl', '/admin'),
      title: meta.title,
      description: meta.description,
    },
  };
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = await getTokenFromCookies();
  if (!token) redirect('/login');

  const locale = await getLocaleFromRequest();
  const user = await getProfileServer(token, locale);
  if (user?.accountType !== 'ADMIN') redirect('/');

  return (
    <SettingsLayout sidebar={<AdminSidebar variant="sidebar" />}>
      {children}
    </SettingsLayout>
  );
}
