import { jobPath } from '@/lib/job-url';
import { authorDisplayName, type Job } from '@/lib/api';

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? 'https://hoplo.pl';

export interface JobPostingJsonLdProps {
  job: Job;
}

/**
 * Builds JobPosting + hiringOrganization JSON-LD for Google Job Search.
 * Rendered only for published jobs so crawlers get valid structured data.
 */
export function JobPostingJsonLd({ job }: JobPostingJsonLdProps) {
  if (job.status !== 'PUBLISHED') return null;

  const jobUrl = `${BASE_URL}${jobPath(job)}`;
  const orgName = authorDisplayName(job.author) || 'Hoplo';

  // jobLocation is required: Place with address (at least addressCountry or addressLocality)
  const jobLocation =
    job.isRemote
      ? {
        '@type': 'Place' as const,
        address: {
          '@type': 'PostalAddress' as const,
          addressCountry: job.language === 'POLISH' ? 'PL' : 'US',
          addressLocality: 'Remote',
        },
      }
      : job.location
        ? {
          '@type': 'Place' as const,
          address: {
            '@type': 'PostalAddress' as const,
            addressLocality: job.location.name,
            addressCountry: job.language === 'POLISH' ? 'PL' : 'US',
          },
        }
        : {
          '@type': 'Place' as const,
          address: {
            '@type': 'PostalAddress' as const,
            addressCountry: job.language === 'POLISH' ? 'PL' : 'US',
          },
        };

  const hiringOrganization = {
    '@type': 'Organization' as const,
    name: orgName,
  };

  const structured: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description,
    datePosted: job.createdAt,
    hiringOrganization,
    jobLocation,
    url: jobUrl,
    identifier: {
      '@type': 'PropertyValue' as const,
      name: 'Hoplo',
      value: job.id,
    },
    directApply: true,
    employmentType: 'CONTRACTOR',
    validThrough: job.deadline ?? undefined,
  };

  if (job.rate && job.currency) {
    const unitText =
      job.billingType === 'HOURLY'
        ? 'HOUR'
        : job.billingType === 'FIXED'
          ? 'ONE_TIME'
          : 'MONTH';
    const numericRate = parseFloat(
      job.rate.replace(/[^0-9.,]/g, '').replace(',', '.'),
    );
    if (!Number.isNaN(numericRate)) {
      structured.baseSalary = {
        '@type': 'MonetaryAmount' as const,
        currency: job.currency,
        value: {
          '@type': 'QuantitativeValue' as const,
          value: numericRate,
          unitText,
        },
      };
    }
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structured) }}
    />
  );
}
