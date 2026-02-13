import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getLocaleFromRequest } from '@/lib/i18n';
import { parseJobSlugId, jobPath } from '@/lib/job-url';
import { fetchJobServer, fetchJobPrevNextServer } from '@/lib/job-server';
import { AUTH_TOKEN_COOKIE, getProfileServer } from '@/lib/api';
import { JobDetailClient } from './JobDetailClient';
import { JobPostingJsonLd } from './JobPostingJsonLd';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { t as translateT } from '@/lib/translations';

async function JobNotFound(_props: { slugId: string }) {
  const locale = await getLocaleFromRequest();
  const translate = (key: string) => translateT(locale, key);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <p className="mb-4 text-destructive">{translate('jobs.jobNotFound')}</p>
      <Button variant="outline" asChild>
        <Link href="/offers/all/1">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {translate('jobs.backToList')}
        </Link>
      </Button>
    </div>
  );
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ slugId: string }>;
}) {
  const { slugId } = await params;
  const id = parseJobSlugId(slugId);

  if (!id) {
    return <JobNotFound slugId={slugId} />;
  }

  const locale = await getLocaleFromRequest();
  const cookieStore = await cookies();
  const tokenRaw = cookieStore.get(AUTH_TOKEN_COOKIE)?.value;
  const token = tokenRaw ? decodeURIComponent(tokenRaw) : null;

  const [job, prevNext, initialUser] = await Promise.all([
    fetchJobServer(id, locale, token),
    fetchJobPrevNextServer(id, locale, token),
    getProfileServer(token, locale),
  ]);

  if (!job) {
    return <JobNotFound slugId={slugId} />;
  }

  // Redirect old /job/{id} URLs to canonical /job/{slug}-{id}
  if (slugId === job.id) {
    redirect(jobPath(job));
  }

  return (
    <>
      <JobPostingJsonLd job={job} />
      <JobDetailClient
        initialJob={job}
        initialPrevNext={prevNext}
        initialUser={initialUser ?? undefined}
        slugId={slugId}
      />
    </>
  );
}
