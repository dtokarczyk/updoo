import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { getLocaleFromRequest } from '@/lib/i18n';
import { getMetadataConfig } from '@/lib/metadata-config';
import { parseJobSlugId } from '@/lib/job-url';
import { AUTH_TOKEN_COOKIE } from '@/lib/api';

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
  token: string | null,
): Promise<JobResponse | null> {
  try {
    const headers: HeadersInit = { 'Accept-Language': locale };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${API_URL}/jobs/${id}`, {
      headers,
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
  const cookieStore = await cookies();
  const tokenRaw = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;
  const token = tokenRaw ? decodeURIComponent(tokenRaw) : null;
  const metaConfig = getMetadataConfig(locale);
  const job = await fetchJobForMeta(id, locale, token);

  if (!job) {
    const offersMeta = metaConfig.offers;
    return {
      title: offersMeta.title,
      description: offersMeta.description,
      openGraph: {
        title: offersMeta.title,
        description: offersMeta.description,
        images: [
          {
            url: '/og-fallback.png',
            width: 1200,
            height: 630,
            alt: offersMeta.title,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: offersMeta.title,
        description: offersMeta.description,
      },
    };
  }

  const meta = metaConfig.jobDetail(job.title);
  const description =
    job.description && job.description.trim().length > 0
      ? truncateDescription(job.description, 160)
      : meta.description;

  const siteName = metaConfig.default.title;
  const fullTitle = `${job.title} | ${siteName}`;
  const ogImageUrl = `${API_URL}/jobs/${job.id}/og-image`;

  return {
    title: { absolute: fullTitle },
    description,
    openGraph: {
      title: fullTitle,
      description,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: job.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [ogImageUrl],
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
