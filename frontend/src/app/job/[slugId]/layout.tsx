import type { Metadata } from 'next';
import { getLocaleFromRequest } from '@/lib/i18n';
import { getMetadataConfig } from '@/lib/metadata-config';
import { parseJobSlugId } from '@/lib/job-url';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface JobResponse {
  id: string;
  title: string;
  description: string;
  status?: string;
}

async function fetchJobForMeta(
  id: string,
  locale: string,
): Promise<JobResponse | null> {
  try {
    const res = await fetch(`${API_URL}/jobs/${id}`, {
      headers: { 'Accept-Language': locale },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return (await res.json()) as JobResponse;
  } catch {
    return null;
  }
}

function truncateDescription(text: string, maxLength: number): string {
  const plain = text.replace(/\s+/g, ' ').trim();
  if (plain.length <= maxLength) return plain;
  return plain.slice(0, maxLength - 3) + '...';
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slugId: string }>;
}): Promise<Metadata> {
  const { slugId } = await params;
  const id = parseJobSlugId(slugId);
  const locale = await getLocaleFromRequest();
  const metaConfig = getMetadataConfig(locale);
  const job = await fetchJobForMeta(id, locale);

  if (!job) {
    return {
      title: metaConfig.offers.title,
      description: metaConfig.offers.description,
    };
  }

  const meta = metaConfig.jobDetail(job.title);
  const description =
    job.description && job.description.trim().length > 0
      ? truncateDescription(job.description, 160)
      : meta.description;

  const siteName = metaConfig.default.title;
  const fullTitle = `${job.title} | ${siteName}`;

  return {
    title: { absolute: fullTitle },
    description,
    openGraph: {
      title: fullTitle,
      description,
    },
  };
}

export default function JobDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
