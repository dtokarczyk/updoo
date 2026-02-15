import { redirect } from 'next/navigation';
import { getLocaleFromRequest } from '@/lib/i18n';
import { getUserJobsServer, getProfileServer } from '@/lib/api';
import { getTokenFromCookies } from '@/lib/auth-server';
import { JobPost } from '@/components/JobPost';
import { jobPathEdit } from '@/lib/job-url';
import Link from 'next/link';
import { t as translateT } from '@/lib/translations';

export default async function MyJobsPage() {
  const token = await getTokenFromCookies();
  if (!token) redirect('/login');

  const locale = await getLocaleFromRequest();
  const user = await getProfileServer(token, locale);
  // Only freelancers see applications; clients and admins stay on jobs
  if (user?.accountType === 'FREELANCER') {
    redirect('/my/applications');
  }

  const jobs = await getUserJobsServer(locale, token);
  const t = (key: string) => translateT(locale, key);

  if (jobs.length === 0) {
    return (
      <div className="w-full">
        <h1 className="text-2xl font-bold text-foreground mb-6">
          {t('my.myListings')}
        </h1>
        <div className="py-12 text-center text-muted-foreground rounded-lg border border-dashed">
          {t('my.noJobs')}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold text-foreground mb-6">
        {t('my.myListings')}
      </h1>
      <div className="space-y-4">
        {jobs.map((job) => {
          const isClosed = job.status === 'CLOSED';
          const isRejected = job.status === 'REJECTED';
          return (
            <JobPost
              key={job.id}
              job={job}
              showFavorite={false}
              isClosed={isClosed}
              isRejected={isRejected}
              headerAction={
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {job.category.name}
                  </span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {job.language === 'ENGLISH' ? 'English' : 'Polish'}
                  </span>
                </div>
              }
              footer={
                !isClosed && !isRejected ? (
                  <Link
                    href={jobPathEdit(job)}
                    className="text-sm text-primary hover:underline"
                  >
                    {t('common.edit')}
                  </Link>
                ) : null
              }
            />
          );
        })}
      </div>
    </div>
  );
}
