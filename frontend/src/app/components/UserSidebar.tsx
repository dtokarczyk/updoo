'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { pl, enUS } from 'date-fns/locale';
import {
  getUserApplications,
  getUserJobs,
  type UserApplication,
  type Job,
} from '@/lib/api';
import { jobPath } from '@/lib/job-url';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { useTranslations } from '@/hooks/useTranslations';
import { UserDropdown } from '@/app/components/HomeNav';
import { useAuth } from '@/contexts/AuthContext';
import type { Locale } from '@/lib/i18n';

interface UserSidebarProps {
  /** Initial locale from server to avoid hydration mismatch */
  initialLocale?: Locale;
}

export function UserSidebar({ initialLocale }: UserSidebarProps) {
  const router = useRouter();
  const { t, locale } = useTranslations();
  const { user, isLoggedIn, logout } = useAuth();
  const [applications, setApplications] = useState<UserApplication[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoggedIn || !user) {
      setLoading(false);
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
      setLoading(false);
    }
  }, [isLoggedIn, user]);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    router.push('/');
    router.refresh();
  };

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
      {/* User section with dropdown and theme toggle */}
      <div className="mb-4 pb-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="relative flex-1" ref={dropdownRef}>
            <UserDropdown
              user={user}
              dropdownOpen={dropdownOpen}
              setDropdownOpen={setDropdownOpen}
              dropdownRef={dropdownRef}
              handleLogout={handleLogout}
              locale={locale}
              t={t}
              fullWidth
            />
          </div>
          <ThemeToggle className="h-[44px] w-[44px] px-0" />
        </div>
      </div>

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

      {user?.accountType === 'ADMIN' && (
        <div className="mb-4">
          <Button
            asChild
            variant="outline"
            size="lg"
            className="w-full justify-start"
          >
            <Link href="/admin">
              <Plus className="size-5 shrink-0" aria-hidden />
              Panel administracyjny
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
              <div className="text-sm text-muted-foreground">
                {t('jobs.noApplications')}
              </div>
            ) : (
              <div className="space-y-2">
                {applications.map((app) => (
                  <Link
                    key={app.id}
                    href={jobPath(app.job)}
                    className="block p-3 rounded-lg border border-border bg-card hover:bg-muted transition-colors"
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
              <div className="text-sm text-muted-foreground py-2">
                {t('jobs.noJobs')}
              </div>
            ) : (
              <div className="space-y-2">
                {jobs.map((job) => {
                  const isClosed = job.status === 'CLOSED';
                  return (
                    <Link
                      key={job.id}
                      href={jobPath(job)}
                      className="block p-3 rounded-lg border border-border bg-card hover:bg-muted transition-colors"
                    >
                      <h4
                        className={`text-sm font-medium line-clamp-2 mb-1 ${
                          isClosed
                            ? 'text-muted-foreground line-through'
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
