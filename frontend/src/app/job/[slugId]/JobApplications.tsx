'use client';

import Link from 'next/link';
import { Mail, Phone, Send, Users, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import { pl, enUS } from 'date-fns/locale';
import { isApplicationFull, type Job, type JobApplication } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { EmptyState } from '@/components/EmptyState';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import type { getStoredUser } from '@/lib/api';

function formatApplicationDateTime(iso: string, locale: 'pl' | 'en'): string {
  const dateFnsLocale = locale === 'en' ? enUS : pl;
  const date = new Date(iso);
  const dateTimeFormat =
    locale === 'en' ? 'd MMM yyyy, HH:mm' : 'd MMM yyyy, HH:mm';
  return format(date, dateTimeFormat, { locale: dateFnsLocale });
}

function applicationDisplayName(app: JobApplication): string {
  if (isApplicationFull(app)) {
    const { name, surname } = app.freelancer;
    if (name && surname) return `${name} ${surname.charAt(0)}.`;
    if (name) return name;
    if (surname) return `${surname.charAt(0)}.`;
    return app.freelancer.email ?? '?';
  }
  return 'freelancerDisplayName' in app && app.freelancerDisplayName
    ? app.freelancerDisplayName
    : 'freelancerInitials' in app
      ? (app.freelancerInitials ?? '?')
      : '?';
}

function applicationInitials(app: JobApplication): string {
  if (isApplicationFull(app)) {
    const { name, surname } = app.freelancer;
    const n = (name?.trim() ?? '').charAt(0).toUpperCase();
    const s = (surname?.trim() ?? '').charAt(0).toUpperCase();
    if (n && s) return `${n}${s}`;
    if (n) return n;
    if (s) return s;
    return (app.freelancer.email ?? '?').charAt(0).toUpperCase();
  }
  return 'freelancerInitials' in app && app.freelancerInitials
    ? String(app.freelancerInitials).slice(0, 2).toUpperCase()
    : '?';
}

export interface JobApplicationsProps {
  job: Job;
  applications: JobApplication[];
  user: ReturnType<typeof getStoredUser>;
  isOwnJob: boolean;
  isDraft: boolean;
  applyFormRef: React.RefObject<HTMLDivElement | null>;
  lastApplicationMessage: string | null;
  deadlinePassed: boolean;
  slotsFull: boolean;
  /** Whether current user (freelancer) meets job's expected applicant type. When false, form is hidden. */
  meetsApplicantCriteria: boolean;
  onApply: (e: React.FormEvent) => void;
  applyMessage: string;
  setApplyMessage: (value: string) => void;
  applySubmitting: boolean;
  applyError: string | null;
  locale: 'pl' | 'en';
  t: (key: string, params?: Record<string, string | number>) => string;
}

export function JobApplications({
  job,
  applications,
  user,
  isOwnJob,
  isDraft,
  applyFormRef,
  deadlinePassed,
  slotsFull,
  meetsApplicantCriteria,
  onApply,
  applyMessage,
  setApplyMessage,
  applySubmitting,
  applyError,
  locale,
  t,
}: JobApplicationsProps) {
  return (
    <section className="border-t pt-6 space-y-4 flex gap-3 items-start">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Users className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
          {job.expectedOffers != null
            ? t('jobs.applicationsCountLimit', {
              submitted: applications.length,
              expected: job.expectedOffers,
            })
            : t('jobs.applicationsCount', { count: applications.length })}
        </p>

        {isOwnJob && applications.length > 0 && (
          <p className="text-xs text-muted-foreground mb-2">
            {t('jobs.applicationsContactDataHint')}
          </p>
        )}

        <ul className="space-y-3 mb-6 list-none p-0">
          {applications.length === 0 ? (
            <EmptyState
              icon={UserPlus}
              message={t('jobs.noApplicationsYetBeFirst')}
              variant="compact"
            />
          ) : (
            applications.map((app) => (
              <li key={app.id}>
                <Card className="overflow-hidden p-0">
                  <CardContent className="p-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <Avatar className="h-10 w-10 shrink-0">
                        {isApplicationFull(app) && app.freelancer.avatarUrl ? (
                          <AvatarImage
                            src={app.freelancer.avatarUrl}
                            alt=""
                          />
                        ) : null}
                        <AvatarFallback className="text-sm font-medium text-muted-foreground">
                          {applicationInitials(app)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <span className="font-medium text-foreground block">
                          {applicationDisplayName(app)}
                        </span>
                        {isApplicationFull(app) && (
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                            {app.freelancer.email && (
                              <a
                                href={`mailto:${app.freelancer.email}`}
                                className="text-muted-foreground text-sm hover:text-foreground inline-flex items-center gap-1.5"
                              >
                                <Mail className="h-3.5 w-3.5 shrink-0" />
                                {app.freelancer.email}
                              </a>
                            )}
                            {app.freelancer.phone && (
                              <a
                                href={`tel:${app.freelancer.phone}`}
                                className="text-muted-foreground text-sm hover:text-foreground inline-flex items-center gap-1.5"
                              >
                                <Phone className="h-3.5 w-3.5 shrink-0" />
                                {app.freelancer.phone}
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                      <span className="text-muted-foreground text-sm shrink-0 ml-auto">
                        {formatApplicationDateTime(app.createdAt, locale)}
                      </span>
                      {isApplicationFull(app) &&
                        app.freelancer.profileSlug ? (
                        <Button variant="outline" size="sm" asChild>
                          <Link
                            href={`/company/${app.freelancer.profileSlug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {t('jobs.viewProfile')}
                          </Link>
                        </Button>
                      ) : null}
                    </div>
                    {'message' in app && app.message != null && app.message !== '' && (
                      <div className="mt-2 pt-2">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                          {t('jobs.applicationMessageContent')}
                        </p>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground">
                          {app.message}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </li>
            ))
          )}
        </ul>

        {user?.accountType === 'FREELANCER' &&
          !isOwnJob &&
          !isDraft &&
          !job.currentUserApplied &&
          !deadlinePassed &&
          !slotsFull &&
          meetsApplicantCriteria && (
            <div ref={applyFormRef}>
              <form onSubmit={onApply} className="space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                  {t('jobs.applyToJob')}
                </p>
                <Textarea
                  placeholder={t('jobs.applyMessagePlaceholder')}
                  value={applyMessage}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setApplyMessage(e.target.value)
                  }
                  maxLength={2000}
                  rows={3}
                  className="resize-none"
                  disabled={applySubmitting}
                />
                {applyError && (
                  <p className="text-sm text-destructive">{applyError}</p>
                )}
                <div className="flex justify-end">
                  <Button type="submit" disabled={applySubmitting}>
                    {applySubmitting ? (
                      t('jobs.applying')
                    ) : (
                      <>
                        <Send className="mr-1.5 h-3.5 w-3.5" />
                        {t('common.submit')}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          )}
      </div>
    </section>
  );
}
