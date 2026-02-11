'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import ReactCountryFlag from 'react-country-flag';
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  Briefcase,
  Calendar,
  Clock,
  FileText,
  MapPin,
  Pencil,
  Send,
  Tag,
  User,
  Users,
  Wrench,
  Laptop,
  BarChart3,
  X,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  getJob,
  applyToJob,
  closeJob,
  getStoredUser,
  authorDisplayName,
  isApplicationFull,
  type Job,
  type JobPrevNext,
  type JobApplication,
} from '@/lib/api';
import { jobPath, jobPathEdit } from '@/lib/job-url';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useTranslations } from '@/hooks/useTranslations';
import { format } from 'date-fns';
import { pl, enUS } from 'date-fns/locale';
import {
  getDeadlineMsLeft,
  formatDeadlineRemaining,
  isDeadlineSoon,
} from '@/lib/deadline-utils';
import { getRateDisplay } from '@/lib/rate-helpers';

const BILLING_LABELS: Record<string, string> = {
  FIXED: 'Ryczałt',
  HOURLY: 'Godzinowo',
};

const HOURS_LABELS: Record<string, string> = {
  LESS_THAN_10: '< 10 h/tydz.',
  FROM_11_TO_20: '11–20 h/tydz.',
  FROM_21_TO_30: '21–30 h/tydz.',
  MORE_THAN_30: '> 30 h/tydz.',
};

const EXPERIENCE_LABELS: Record<string, string> = {
  JUNIOR: 'Junior',
  MID: 'Mid',
  SENIOR: 'Senior',
};

const PROJECT_TYPE_LABELS: Record<string, string> = {
  ONE_TIME: 'Jednorazowy',
  CONTINUOUS: 'Ciągły',
};

function formatDate(iso: string, locale: 'pl' | 'en'): string {
  const dateFnsLocale = locale === 'en' ? enUS : pl;
  const date = new Date(iso);
  const dateFormat =
    locale === 'en' ? "d MMMM yyyy 'at' HH:mm" : "d MMMM yyyy 'o' HH:mm";
  return format(date, dateFormat, { locale: dateFnsLocale });
}

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

function DetailRow({
  icon: Icon,
  label,
  value,
  valueClassName,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
}) {
  if (value == null || value === '') return null;
  return (
    <div className="flex gap-3 items-start">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </p>
        <p className={cn('text-sm font-medium', valueClassName)}>{value}</p>
      </div>
    </div>
  );
}

function JobRateValue({
  user,
  job,
  t,
}: {
  user: ReturnType<typeof getStoredUser>;
  job: Job;
  t: (key: string) => string;
}) {
  const rd = getRateDisplay(!!user, job);
  if (rd.type === 'negotiable') {
    return (
      <span className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
        {t('jobs.negotiable')}
      </span>
    );
  }
  if (rd.type === 'blur') {
    const loginUrl = `/login?returnUrl=${encodeURIComponent(jobPath(job))}`;
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={loginUrl}
            className="cursor-pointer blur-sm select-none text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            {rd.placeholder}
          </Link>
        </TooltipTrigger>
        <TooltipContent>
          <p>{t('jobs.loginToSeeRate')}</p>
        </TooltipContent>
      </Tooltip>
    );
  }
  return (
    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
      {rd.formatted}
    </span>
  );
}

function JobActions({
  isOwnJob,
  isAdmin,
  isDraft,
  isClosed,
  user,
  canApply,
  currentUserApplied,
  deadlinePassed,
  canClose,
  closeSubmitting,
  job,
  onApplyClick,
  onClose,
  t,
  layout = 'column',
}: {
  isOwnJob: boolean;
  isAdmin: boolean;
  isDraft: boolean;
  isClosed: boolean;
  user: ReturnType<typeof getStoredUser>;
  canApply: boolean;
  currentUserApplied: boolean | undefined;
  deadlinePassed: boolean;
  canClose: boolean;
  closeSubmitting: boolean;
  job: Job;
  onApplyClick: () => void;
  onClose: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  layout?: 'column' | 'row';
}) {
  const isOwnerOrAdmin = isOwnJob || isAdmin;
  const isFreelancerCanSee =
    !isDraft && !isClosed && user?.accountType === 'FREELANCER';
  const isGuestApplyCta = !user && !isDraft && !isClosed;

  if (!isOwnerOrAdmin && !isFreelancerCanSee && !isGuestApplyCta) {
    return null;
  }

  const containerClassName = layout === 'row' ? 'flex gap-2' : 'space-y-2';
  const loginUrl = `/login?returnUrl=${encodeURIComponent(jobPath(job))}`;

  return (
    <div className={containerClassName}>
      {isOwnerOrAdmin ? (
        <>
          <Button className="w-full" size="lg" asChild>
            <Link href={jobPathEdit(job)}>
              <Pencil className="mr-2 h-4 w-4" />
              {t('jobs.edit')}
            </Link>
          </Button>
          {canClose && (
            <Button
              className="w-full"
              size="lg"
              variant="destructive"
              onClick={onClose}
              disabled={closeSubmitting}
            >
              <X className="mr-2 h-4 w-4" />
              {closeSubmitting ? t('jobs.closing') : t('jobs.close')}
            </Button>
          )}
        </>
      ) : isGuestApplyCta ? (
        <Button className="w-full" size="lg" asChild>
          <Link href={loginUrl}>
            <Send className="mr-2 h-4 w-4" />
            {t('jobs.apply')}
          </Link>
        </Button>
      ) : canApply ? (
        <Button onClick={onApplyClick} className="w-full" size="lg">
          <Send className="mr-2 h-4 w-4" />
          {t('jobs.apply')}
        </Button>
      ) : currentUserApplied === true ? (
        <Button disabled className="w-full" size="lg" variant="outline">
          {t('jobs.appliedShort')}
        </Button>
      ) : deadlinePassed ? (
        <Button disabled className="w-full" size="lg" variant="outline">
          {t('jobs.deadlinePassed')}
        </Button>
      ) : (
        <Button onClick={onApplyClick} className="w-full" size="lg">
          <Send className="mr-2 h-4 w-4" />
          {t('jobs.apply')}
        </Button>
      )}
    </div>
  );
}

interface JobDetailClientProps {
  initialJob: Job;
  initialPrevNext: JobPrevNext;
  slugId: string;
}

export function JobDetailClient({
  initialJob,
  initialPrevNext,
  slugId,
}: JobDetailClientProps) {
  const { t, locale } = useTranslations();
  const router = useRouter();
  const [job, setJob] = useState<Job>(initialJob);
  const [prevNext] = useState<JobPrevNext>(initialPrevNext);
  const [applyMessage, setApplyMessage] = useState('');
  const [applySubmitting, setApplySubmitting] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [lastApplicationMessage, setLastApplicationMessage] = useState<
    string | null
  >(null);
  const [closeSubmitting, setCloseSubmitting] = useState(false);
  const user = getStoredUser();
  const applyFormRef = useRef<HTMLDivElement>(null);

  const id = job.id;

  // Refetch job when user is logged in to get currentUserApplied, applications, etc.
  useEffect(() => {
    if (!user) return;
    getJob(id)
      .then((data) => {
        setJob(data);
        const backendMessage = data.currentUserApplicationMessage;
        if (backendMessage && backendMessage.trim().length > 0) {
          setLastApplicationMessage(backendMessage);
        } else if (
          data.currentUserApplied &&
          data.applications &&
          data.applications.length > 0
        ) {
          const maybeOwnApplication = data.applications.find(isApplicationFull);
          if (maybeOwnApplication && maybeOwnApplication.message) {
            setLastApplicationMessage(maybeOwnApplication.message);
          }
        }
      })
      .catch(() => {});
  }, [id, user]);

  // Fill default message when job loads and user is freelancer
  useEffect(() => {
    if (!job || !user) return;

    const isOwnJob = user.id === job.authorId;
    const isDraft = job.status === 'DRAFT';
    const deadlineMsLeft = getDeadlineMsLeft(job.deadline);
    const deadlinePassed = deadlineMsLeft !== null && deadlineMsLeft <= 0;
    const canApply =
      user.accountType === 'FREELANCER' &&
      !isOwnJob &&
      !isDraft &&
      !deadlinePassed &&
      !job.currentUserApplied;

    if (
      canApply &&
      user.defaultMessage &&
      user.defaultMessage.trim().length > 0
    ) {
      setApplyMessage((prev) => {
        if (prev.trim().length === 0) {
          return user.defaultMessage || '';
        }
        return prev;
      });
    }
  }, [job, user]);

  const skills = job.skills?.map((r) => r.skill.name) ?? [];
  const isOwnJob = user?.id === job.authorId;
  const isAdmin = user?.accountType === 'ADMIN';
  const isDraft = job.status === 'DRAFT';
  const isRejected = job.status === 'REJECTED';
  const isClosed = job.status === 'CLOSED';
  const deadlineMsLeft = getDeadlineMsLeft(job.deadline);
  const deadlinePassed = deadlineMsLeft !== null && deadlineMsLeft <= 0;
  const deadlineSoon = isDeadlineSoon(deadlineMsLeft, isClosed);
  const canApply =
    user?.accountType === 'FREELANCER' &&
    !isOwnJob &&
    !isDraft &&
    !isClosed &&
    !deadlinePassed &&
    !job.currentUserApplied;

  const canClose = (isOwnJob || isAdmin) && !isClosed && !isDraft;
  const applications = job.applications ?? [];

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    if (!id || !canApply) return;
    const messageToSend = applyMessage.trim();
    setLastApplicationMessage(messageToSend || null);
    setApplySubmitting(true);
    setApplyError(null);
    try {
      await applyToJob(id, messageToSend || undefined);
      const updated = await getJob(id);
      setJob(updated);
      if (
        updated.currentUserApplicationMessage &&
        updated.currentUserApplicationMessage.trim().length > 0
      ) {
        setLastApplicationMessage(updated.currentUserApplicationMessage);
      }
      setApplyMessage('');
    } catch (e) {
      setApplyError(e instanceof Error ? e.message : 'Błąd zgłoszenia');
    } finally {
      setApplySubmitting(false);
    }
  }

  function handleApplyClick() {
    if (!user) {
      const returnUrl = job ? jobPath(job) : `/job/${slugId}`;
      router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
      return;
    }

    if (user.accountType !== 'FREELANCER') {
      const returnUrl = job ? jobPath(job) : `/job/${slugId}`;
      router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
      return;
    }

    if (canApply && applyFormRef.current) {
      applyFormRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
      setTimeout(() => {
        const textarea = applyFormRef.current?.querySelector('textarea');
        if (textarea) {
          textarea.focus();
        }
      }, 500);
    }
  }

  async function handleClose() {
    if (!id || !canClose) return;
    setCloseSubmitting(true);
    try {
      const updated = await closeJob(id);
      setJob(updated);
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Błąd zamykania oferty');
    } finally {
      setCloseSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-6">
        <div className="lg:col-span-4 space-y-6">
          <div className="space-y-4">
            <div>
              <h1 className="text-4xl font-semibold leading-tight">
                {job.title}
              </h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  {authorDisplayName(job.author) || job.author.email}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(job.createdAt, locale)}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
                <Tag className="h-3.5 w-3.5" />
                {job.category.name}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
                <ReactCountryFlag
                  svg
                  countryCode={job.language === 'ENGLISH' ? 'GB' : 'PL'}
                  style={{ width: '1em', height: '1em' }}
                />
                {job.language === 'ENGLISH'
                  ? t('jobs.english')
                  : t('jobs.polish')}
              </span>
            </div>
            {isDraft && (
              <div className="rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 px-3 py-2 text-sm">
                {t('jobs.draftVisibleOnlyToYou')}
              </div>
            )}
            {isRejected && isOwnJob && (
              <div className="rounded-lg bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200 px-3 py-2 text-sm space-y-2">
                <p className="font-medium">{t('jobs.rejected')}</p>
                {job.rejectedReason && (
                  <p className="text-sm whitespace-pre-wrap">
                    {job.rejectedReason}
                  </p>
                )}
                <p className="text-sm">{t('jobs.rejectedEditHint')}</p>
              </div>
            )}
            {isClosed && (
              <div className="rounded-lg bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200 px-3 py-2 text-sm">
                {t('jobs.closed')}
                {job.closedAt && (
                  <span className="ml-2">
                    ({formatDate(job.closedAt, locale)})
                  </span>
                )}
              </div>
            )}
          </div>

          <section className="block lg:hidden space-y-6 border-t pt-6">
            <DetailRow
              icon={Banknote}
              label={t('jobs.rate')}
              value={<JobRateValue user={user} job={job} t={t} />}
            />
            <DetailRow
              icon={Briefcase}
              label={t('jobs.billingType')}
              value={BILLING_LABELS[job.billingType] ?? job.billingType}
            />
            {job.billingType === 'HOURLY' && job.hoursPerWeek && (
              <DetailRow
                icon={Clock}
                label={t('jobs.hoursPerWeek')}
                value={HOURS_LABELS[job.hoursPerWeek] ?? job.hoursPerWeek}
              />
            )}
            <DetailRow
              icon={BarChart3}
              label={t('jobs.experienceLevel')}
              value={
                EXPERIENCE_LABELS[job.experienceLevel] ?? job.experienceLevel
              }
            />
            <DetailRow
              icon={Briefcase}
              label={t('jobs.projectType')}
              value={PROJECT_TYPE_LABELS[job.projectType] ?? job.projectType}
            />
            {job.deadline && (
              <DetailRow
                icon={Clock}
                label={t('jobs.deadline')}
                value={formatDeadlineRemaining(job.deadline, t) ?? undefined}
                valueClassName={
                  deadlineSoon
                    ? 'font-bold text-red-600 dark:text-red-400'
                    : undefined
                }
              />
            )}
            {job.location && (
              <DetailRow
                icon={MapPin}
                label={t('jobs.location')}
                value={job.location.name}
              />
            )}
            {job.isRemote && (
              <DetailRow
                icon={Laptop}
                label={t('jobs.remoteWork')}
                value={t('common.yes')}
              />
            )}
          </section>

          {skills.length > 0 && (
            <section>
              <div className="flex gap-3 items-start">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Wrench className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                    {t('jobs.skills')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((name) => (
                      <span
                        key={name}
                        className="rounded-full bg-muted px-3 py-1 text-sm text-foreground"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

          <section>
            <div className="flex gap-3 items-start mb-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <FileText className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                  {t('jobs.description')}
                </p>
                <p className="text-base whitespace-pre-wrap leading-relaxed">
                  {job.description}
                </p>
              </div>
            </div>
          </section>

          <section className="border-t pt-6 space-y-4 flex gap-3 items-start">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Users className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                {t('jobs.applicationsCount', { count: applications.length })}
              </p>
              <ul className="space-y-2 mb-6">
                {applications.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">
                    {t('jobs.noApplicationsYetBeFirst')}
                  </p>
                ) : (
                  applications.map((app) => (
                    <li
                      key={app.id}
                      className="flex items-center justify-between gap-3 py-2 border-b border-border last:border-0 text-sm"
                    >
                      <span className="font-medium text-foreground">
                        {applicationDisplayName(app)}
                      </span>
                      <span className="text-muted-foreground tabular-nums">
                        {formatApplicationDateTime(app.createdAt, locale)}
                      </span>
                    </li>
                  ))
                )}
              </ul>

              {user?.accountType === 'FREELANCER' && !isOwnJob && !isDraft && (
                <div ref={applyFormRef}>
                  {job.currentUserApplied ? (
                    <div className="space-y-3">
                      {lastApplicationMessage && (
                        <div className="rounded-lg border bg-muted/40 px-3 py-2">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                            {t('jobs.applicationMessageContent')}
                          </p>
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">
                            {lastApplicationMessage}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : deadlinePassed ? (
                    <p className="text-sm text-muted-foreground">
                      {t('jobs.deadlinePassedMessage')}
                    </p>
                  ) : (
                    <form onSubmit={handleApply} className="space-y-3">
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
                  )}
                </div>
              )}
            </div>
          </section>
        </div>

        <aside className="hidden lg:block lg:col-span-2 lg:self-start lg:sticky lg:top-8">
          <div className="space-y-6">
            <div className="hidden lg:block">
              <JobActions
                isOwnJob={isOwnJob}
                isAdmin={isAdmin}
                isDraft={isDraft}
                isClosed={isClosed}
                user={user}
                canApply={canApply}
                currentUserApplied={job.currentUserApplied}
                deadlinePassed={deadlinePassed}
                canClose={canClose}
                closeSubmitting={closeSubmitting}
                job={job}
                onApplyClick={handleApplyClick}
                onClose={handleClose}
                t={t}
                layout="column"
              />
            </div>

            <DetailRow
              icon={Banknote}
              label={t('jobs.rate')}
              value={<JobRateValue user={user} job={job} t={t} />}
            />
            <DetailRow
              icon={Briefcase}
              label={t('jobs.billingType')}
              value={BILLING_LABELS[job.billingType] ?? job.billingType}
            />
            {job.billingType === 'HOURLY' && job.hoursPerWeek && (
              <DetailRow
                icon={Clock}
                label={t('jobs.hoursPerWeek')}
                value={HOURS_LABELS[job.hoursPerWeek] ?? job.hoursPerWeek}
              />
            )}
            <DetailRow
              icon={BarChart3}
              label={t('jobs.experienceLevel')}
              value={
                EXPERIENCE_LABELS[job.experienceLevel] ?? job.experienceLevel
              }
            />
            <DetailRow
              icon={Briefcase}
              label={t('jobs.projectType')}
              value={PROJECT_TYPE_LABELS[job.projectType] ?? job.projectType}
            />
            {job.deadline && (
              <DetailRow
                icon={Clock}
                label={t('jobs.deadline')}
                value={formatDeadlineRemaining(job.deadline, t) ?? undefined}
                valueClassName={
                  deadlineSoon
                    ? 'font-bold text-red-600 dark:text-red-400'
                    : undefined
                }
              />
            )}
            {job.location && (
              <DetailRow
                icon={MapPin}
                label={t('jobs.location')}
                value={job.location.name}
              />
            )}
            {job.isRemote && (
              <DetailRow
                icon={Laptop}
                label={t('jobs.remoteWork')}
                value={t('common.yes')}
              />
            )}
          </div>
        </aside>
      </div>

      {(prevNext?.prev || prevNext?.next) && (
        <section className="mt-10 border-t pt-6">
          <div className="flex gap-4">
            {prevNext.prev ? (
              <Link
                href={jobPath(prevNext.prev)}
                className="group flex-1 rounded-lg border bg-muted/30 p-4 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1.5">
                  <ArrowLeft className="h-4 w-4" />
                  <span>{t('jobs.previous')}</span>
                </div>
                <p className="font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                  {prevNext.prev.title}
                </p>
              </Link>
            ) : (
              <div className="flex-1" />
            )}
            {prevNext.next ? (
              <Link
                href={jobPath(prevNext.next)}
                className="group flex-1 rounded-lg border bg-muted/30 p-4 transition-colors hover:bg-muted/50 text-right"
              >
                <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground mb-1.5">
                  <span>{t('jobs.next')}</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
                <p className="font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                  {prevNext.next.title}
                </p>
              </Link>
            ) : (
              <div className="flex-1" />
            )}
          </div>
        </section>
      )}

      {(isOwnJob ||
        isAdmin ||
        canApply ||
        (!user && !isDraft && !isClosed)) && (
        <div className="fixed inset-x-0 bottom-16 z-50 border-t border-border bg-background/95 px-4 py-3 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] backdrop-blur lg:hidden">
          <div className="mx-auto max-w-4xl">
            <JobActions
              isOwnJob={isOwnJob}
              isAdmin={isAdmin}
              isDraft={isDraft}
              isClosed={isClosed}
              user={user}
              canApply={canApply}
              currentUserApplied={job.currentUserApplied}
              deadlinePassed={deadlinePassed}
              canClose={canClose}
              closeSubmitting={closeSubmitting}
              job={job}
              onApplyClick={handleApplyClick}
              onClose={handleClose}
              t={t}
              layout="row"
            />
          </div>
        </div>
      )}
    </div>
  );
}
