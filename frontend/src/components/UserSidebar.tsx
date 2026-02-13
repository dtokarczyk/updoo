'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, FileText, Briefcase } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { pl, enUS } from 'date-fns/locale';
import {
  getUserApplications,
  getUserJobs,
  type UserApplication,
  type Job,
} from '@/lib/api';
import { jobPath } from '@/lib/job-url';
import { Button } from '@/components/ui/button';
import { useTranslations } from '@/hooks/useTranslations';
import { EmptyState } from '@/components/EmptyState';
import { UserDropdown } from '@/components/UserDropdown';
import { useAuth } from '@/contexts/AuthContext';
import type { Locale } from '@/lib/i18n';

interface UserSidebarProps {
  /** Initial locale from server to avoid hydration mismatch */
  initialLocale?: Locale;
}

export function UserSidebar(_props: UserSidebarProps) {
  const { t, locale } = useTranslations();
  const { user, isLoggedIn } = useAuth();
  const [applications, setApplications] = useState<UserApplication[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn || !user) {
      queueMicrotask(() => setLoading(false));
      return;
    }

    const accountType = user.accountType;

    if (accountType === 'FREELANCER') {
      getUserApplications()
        .then((data) => {
          setApplications(data);
        })
        .catch((err) => {
          console.error('Failed to load applications:', err);
        })
        .finally(() => {
          setLoading(false);
        });
    } else if (accountType === 'CLIENT') {
      getUserJobs()
        .then((data) => {
          setJobs(data);
        })
        .catch((err) => {
          console.error('Failed to load jobs:', err);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      queueMicrotask(() => setLoading(false));
    }
  }, [isLoggedIn, user]);

  if (!isLoggedIn) {
    return null;
  }

  const dateFnsLocale = locale === 'en' ? enUS : pl;

  function formatPostedAgo(iso: string): string {
    return formatDistanceToNow(new Date(iso), {
      addSuffix: true,
      locale: dateFnsLocale,
    });
  }

  return (
    <>
      {user?.accountType === 'CLIENT' && (
        <div className="mb-4">
          <Button
            asChild
            variant="default"
            size="lg"
            className="w-full justify-start"
          >
            <Link href="/job/new">
              <Plus className="size-5 shrink-0" aria-hidden />
              {t('jobs.newJob')}
            </Link>
          </Button>
        </div>
      )}

      {/* Recent applications (for freelancer) or jobs (for client) */}
      {user?.accountType && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">
            {user.accountType === 'FREELANCER'
              ? t('jobs.recentApplications')
              : t('jobs.myJobs')}
          </h3>
          {loading ? (
            <div className="text-sm text-muted-foreground">
              {t('common.loading')}
            </div>
          ) : user.accountType === 'FREELANCER' ? (
            applications.length === 0 ? (
              <EmptyState
                icon={FileText}
                message={t('jobs.noApplications')}
                variant="compact"
              />
            ) : (
              <div className="space-y-2">
                {applications.map((app) => (
                  <Link
                    key={app.id}
                    href={jobPath(app.job)}
                    className="block p-3 rounded-lg border border-border bg-card hover:border-primary transition-colors"
                  >
                    <h4 className="text-sm font-medium text-foreground line-clamp-2 mb-1">
                      {app.job.title}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {formatPostedAgo(app.createdAt)}
                    </p>
                    {app.job.category && (
                      <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                        {app.job.category.name}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            )
          ) : user.accountType === 'CLIENT' ? (
            jobs.length === 0 ? (
              <EmptyState
                icon={Briefcase}
                message={t('jobs.noJobs')}
                variant="compact"
              />
            ) : (
              <div className="space-y-2">
                {jobs.map((job) => {
                  const isClosed = job.status === 'CLOSED';
                  const isRejected = job.status === 'REJECTED';
                  return (
                    <Link
                      key={job.id}
                      href={jobPath(job)}
                      className={`block p-3 rounded-lg border border-border bg-card hover:border-primary transition-colors ${isRejected ? 'border-red-500/40' : ''}`}
                    >
                      <h4
                        className={`text-sm font-medium line-clamp-2 mb-1 ${isClosed
                          ? 'text-muted-foreground line-through'
                          : isRejected
                            ? 'text-red-700 dark:text-red-400'
                            : 'text-foreground'
                          }`}
                      >
                        {job.title}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {formatPostedAgo(job.createdAt)}
                      </p>
                      {job.category && (
                        <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                          {job.category.name}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            )
          ) : null}
        </div>
      )}
    </>
  );
}
