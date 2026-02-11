import type { Metadata } from 'next';
import { getLocaleFromRequest } from '@/lib/i18n';
import { getMetadataConfig } from '@/lib/metadata-config';
import { requireAuth } from '@/lib/auth-server';
import { MyLayoutClient } from '@/app/my/MyLayoutClient';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocaleFromRequest();
  const meta = getMetadataConfig(locale).my;
  return {
    title: meta.title,
    description: meta.description,
    robots: 'noindex, nofollow',
    openGraph: {
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
    <div className="flex min-h-full w-full justify-center p-4 md:p-6">
      <div className="w-full max-w-7xl">
        <MyLayoutClient>{children}</MyLayoutClient>
      </div>
    </div>
  );
}
