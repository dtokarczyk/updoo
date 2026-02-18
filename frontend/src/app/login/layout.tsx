import type { Metadata } from 'next';
import { getLocaleFromRequest } from '@/lib/i18n';
import { getMetadataConfig, getDefaultOpenGraph } from '@/lib/metadata-config';

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://hoplo.pl';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocaleFromRequest();
  const meta = getMetadataConfig(locale).login;
  return {
    title: meta.title,
    description: meta.description,
    openGraph: {
      ...getDefaultOpenGraph(baseUrl, '/login'),
      title: meta.title,
      description: meta.description,
    },
  };
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
