import type { Metadata } from 'next';
import { getLocaleFromRequest } from '@/lib/i18n';
import { getMetadataConfig, getDefaultOpenGraph } from '@/lib/metadata-config';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocaleFromRequest();
  const meta = getMetadataConfig(locale).jobNew;
  return {
    title: meta.title,
    description: meta.description,
    robots: 'noindex, nofollow',
    openGraph: {
      ...getDefaultOpenGraph(process.env.NEXT_PUBLIC_APP_URL ?? 'https://hoplo.pl', '/job/new'),
      title: meta.title,
      description: meta.description,
    },
  };
}

export default function JobNewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
