import type { Metadata } from 'next';
import { getLocaleFromRequest } from '@/lib/i18n';
import { getMetadataConfig, getDefaultOpenGraph } from '@/lib/metadata-config';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocaleFromRequest();
  const meta = getMetadataConfig(locale).resetPassword;
  return {
    title: meta.title,
    description: meta.description,
    openGraph: {
      ...getDefaultOpenGraph(process.env.NEXT_PUBLIC_APP_URL ?? 'https://hoplo.pl', '/login/reset-password'),
      title: meta.title,
      description: meta.description,
    },
  };
}

export default function ResetPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
