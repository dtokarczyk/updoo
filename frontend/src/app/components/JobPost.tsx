'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { pl, enUS } from 'date-fns/locale';
import {
  getDeadlineMsLeft,
  isDeadlineSoon as isDeadlineSoonUtil,
  formatDeadlineRemaining,
} from '@/lib/deadline-utils';
import { Calendar, Clock, Settings2, Star, Hand } from 'lucide-react';
import type { Job } from '@/lib/api';
import { jobPath } from '@/lib/job-url';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getRateDisplay } from '@/lib/rate-helpers';
import { useTranslations } from '@/hooks/useTranslations';

const EXPERIENCE_LABELS: Record<string, string> = {
  JUNIOR: 'Junior',
  MID: 'Mid',
  SENIOR: 'Senior',
};

const LISTING_DESCRIPTION_MAX_LENGTH = 200;

function truncateDescription(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + '…';
}

/** Deterministic "random" number from jobId for blurred rate placeholder (unauthenticated users). */
function formatPostedAgo(iso: string, locale: 'pl' | 'en'): string {
  const dateFnsLocale = locale === 'en' ? enUS : pl;
  return formatDistanceToNow(new Date(iso), {
    addSuffix: true,
    locale: dateFnsLocale,
  });
}

export function JobPost({
  job,
  headerAction,
  headerRightAction,
  isDraft,
  isClosed,
  isApplied,
  isVisited = true,
  onFavoriteToggle,
  onNavigate,
  showFavorite,
  className,
  footer,
  /** When false, rate is always shown blurred (for unauthenticated users). */
  isLoggedIn = true,
}: {
  job: Job;
  headerAction?: React.ReactNode;
  headerRightAction?: React.ReactNode;
  isDraft?: boolean;
  isClosed?: boolean;
  /** User has applied to this job (feed border state). */
  isApplied?: boolean;
  /** User has already visited this job (unvisited = highlight border). */
  isVisited?: boolean;
  /** Called after favorite add/remove; parent can refetch. */
  onFavoriteToggle?: (jobId: string) => void;
  /** Called when user navigates to job details. */
  onNavigate?: () => void;
  /** When true, show star in top-right (e.g. when user is logged in). */
  showFavorite?: boolean;
  /** Optional class names for the card wrapper. */
  className?: string;
  /** Optional footer content (e.g. draft admin bar, actions). */
  footer?: React.ReactNode;
  /** When false, rate is always shown blurred (for unauthenticated users). */
  isLoggedIn?: boolean;
}) {
  const isFavorite = Boolean(job.isFavorite);

  const borderStateClass = [
    isDraft ? 'border-alert' : '',
    isApplied && !isDraft ? 'border-success' : '',
    !isVisited && !isDraft && !isApplied && !isClosed ? 'border-primary' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (favoriteLoading || !onFavoriteToggle) return;
    setFavoriteLoading(true);
    try {
      const { addFavorite, removeFavorite } = await import('@/lib/api');
      if (isFavorite) await removeFavorite(job.id);
      else await addFavorite(job.id);
      onFavoriteToggle(job.id);
    } catch {
      // Error could be shown via toast; for now just ignore
    } finally {
      setFavoriteLoading(false);
    }
  };
  const { t, locale } = useTranslations();
  const skills = job.skills?.map((r) => r.skill.name) ?? [];
  const shortDescription = truncateDescription(
    job.description,
    LISTING_DESCRIPTION_MAX_LENGTH,
  );
  const metaPosted = formatPostedAgo(job.createdAt, locale);
  const msLeft = getDeadlineMsLeft(job.deadline);
  const metaDeadlineLeft = job.deadline
    ? (formatDeadlineRemaining(job.deadline, t) ?? '')
    : '';
  const isDeadlineSoon = isDeadlineSoonUtil(msLeft, isClosed);

  const firstFieldLabel =
    EXPERIENCE_LABELS[job.experienceLevel] ?? job.experienceLevel;
  const firstFieldSub = t('jobs.experienceLevel');
  const rateDisplay = getRateDisplay(isLoggedIn, job);
  const secondFieldLabel =
    rateDisplay.type === 'negotiable'
      ? t('jobs.negotiable')
      : rateDisplay.type === 'blur'
        ? rateDisplay.placeholder
        : rateDisplay.formatted;
  const rateLabel =
    job.billingType === 'HOURLY' ? t('jobs.hourlyRate') : t('jobs.rate');
  const secondFieldSub = rateLabel;

  return (
    <Card className={cn(className, 'overflow-hidden', borderStateClass)}>
      <CardHeader className="pb-2">
        {(headerAction || showFavorite || headerRightAction) && (
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {typeof job.applicationsCount === 'number' &&
                (showFavorite || headerRightAction) && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    <Hand className="h-3.5 w-3.5 stroke-2" aria-hidden />
                    <span className="font-bold text-foreground">
                      {job.applicationsCount}
                    </span>
                  </span>
                )}
              {headerAction}
            </div>

            {(showFavorite || headerRightAction) && (
              <div className="flex items-center gap-1">
                {headerRightAction}
                {showFavorite && (
                  <Button
                    variant="outline"
                    size="icon-lg"
                    onClick={handleFavoriteClick}
                    disabled={favoriteLoading}
                    aria-label={
                      isFavorite ? 'Usuń z ulubionych' : 'Dodaj do ulubionych'
                    }
                  >
                    <Star
                      className={cn(
                        'h-5 w-5',
                        isFavorite
                          ? 'fill-yellow-500 text-yellow-500'
                          : 'fill-none text-muted-foreground',
                      )}
                    />
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <CardTitle
              className={cn(
                'text-xl font-bold leading-tight',
                isClosed
                  ? 'text-muted-foreground line-through'
                  : 'text-foreground',
              )}
            >
              <Link
                href={jobPath(job)}
                className="hover:underline focus:outline-none focus:underline"
                onClick={onNavigate}
              >
                {job.title}
              </Link>
            </CardTitle>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-4 w-4" aria-hidden />
                {t('jobs.published')} {metaPosted}
              </span>
              {isClosed && (
                <span className="inline-flex items-center gap-1.5 font-medium text-muted-foreground">
                  {t('jobs.closed')}
                </span>
              )}
              {metaDeadlineLeft && !isClosed && (
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5',
                    isDeadlineSoon &&
                      'font-bold text-red-600 dark:text-red-400',
                  )}
                >
                  <Clock
                    className={cn(
                      'h-4 w-4',
                      isDeadlineSoon && 'text-red-600 dark:text-red-400',
                    )}
                    aria-hidden
                  />
                  {metaDeadlineLeft}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent
        className={cn('space-y-4', isClosed && 'text-muted-foreground')}
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p
                className={cn(
                  'font-semibold',
                  isClosed ? 'text-muted-foreground' : 'text-foreground',
                )}
              >
                {firstFieldLabel}
              </p>
              <p className="text-sm text-muted-foreground">{firstFieldSub}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Settings2 className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p
                className={cn(
                  'font-semibold',
                  isClosed ? 'text-muted-foreground' : 'text-foreground',
                )}
              >
                <span
                  className={cn(
                    'text-emerald-600 dark:text-emerald-400',
                    rateDisplay.type === 'blur' && 'blur-sm select-none',
                  )}
                >
                  {secondFieldLabel}
                </span>
              </p>
              <p className="text-sm text-muted-foreground">{secondFieldSub}</p>
            </div>
          </div>
        </div>

        <p
          className={cn(
            'text-sm',
            isClosed ? 'text-muted-foreground' : 'text-foreground',
          )}
        >
          {shortDescription}
        </p>

        {skills.length > 0 ? (
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {skills.map((name) => (
                <span
                  key={name}
                  className={cn(
                    'rounded-full bg-muted px-3 py-1 text-sm',
                    isClosed ? 'text-muted-foreground' : 'text-foreground',
                  )}
                >
                  {name}
                </span>
              ))}
            </div>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="mt-2 shrink-0"
            >
              <Link href={jobPath(job)} onClick={onNavigate}>
                {t('jobs.seeMore')}
              </Link>
            </Button>
          </div>
        ) : (
          <div className="flex justify-end">
            <Button
              asChild
              variant="outline"
              size="lg"
              className="mt-2 shrink-0"
            >
              <Link href={jobPath(job)} onClick={onNavigate}>
                {t('jobs.seeMore')}
              </Link>
            </Button>
          </div>
        )}
      </CardContent>

      {footer != null && <CardFooter className="border-t">{footer}</CardFooter>}
    </Card>
  );
}
