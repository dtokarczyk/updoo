import { redirect } from 'next/navigation';
import { getLocaleFromRequest } from '@/lib/i18n';
import { getUserApplicationsServer } from '@/lib/api';
import { getTokenFromCookies } from '@/lib/auth-server';
import { JobPost } from '@/components/JobPost';
import { t as translateT } from '@/lib/translations';

export default async function MyApplicationsPage() {
  const token = await getTokenFromCookies();
  if (!token) redirect('/login');

  const locale = await getLocaleFromRequest();
  const applications = await getUserApplicationsServer(locale, token);
  const t = (key: string) => translateT(locale, key);

  if (applications.length === 0) {
    return (
      <div className="w-full">
        <h1 className="text-2xl font-bold text-foreground mb-6">
          {t('my.recentApplications')}
        </h1>
        <div className="py-12 text-center text-muted-foreground rounded-lg border border-dashed">
          {t('my.noApplications')}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h1 className="text-2xl font-bold text-foreground mb-6">
        {t('my.recentApplications')}
      </h1>
      <div className="space-y-4">
        {applications.map((app) => (
          <JobPost
            key={app.id}
            job={app.job}
            showFavorite
            headerAction={
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {app.job.category.name}
                </span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {app.job.language === 'ENGLISH' ? 'English' : 'Polish'}
                </span>
              </div>
            }
          />
        ))}
      </div>
    </div>
  );
}
