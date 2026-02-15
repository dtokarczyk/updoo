'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState, useRef } from 'react';
import ReactCountryFlag from 'react-country-flag';
import { ArrowLeft, ArrowRight, Calendar, FileText, Tag } from 'lucide-react';
import {
  applyToJob,
  closeJob,
  getStoredUser,
  publishJob,
  rejectJob,
  authorDisplayName,
  type AuthUser,
  type Job,
  type JobPrevNext,
} from '@/lib/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { jobPath, jobPathEdit } from '@/lib/job-url';
import { useTranslations } from '@/hooks/useTranslations';
import { getDeadlineMsLeft, isDeadlineSoon } from '@/lib/deadline-utils';
import { formatDate } from '@/lib/format-date';
import { JobApplications } from './JobApplications';
import { JobMeta } from './JobMeta';
import { JobRateValue } from './JobRateValue';
import { JobActions } from './JobActions';
import { JobSidebar } from './JobSidebar';
import { RejectJobDialog } from '@/components/RejectJobDialog';

interface JobDetailClientProps {
  initialJob: Job;
  initialPrevNext: JobPrevNext;
  /** User from SSR when authenticated; client falls back to getStoredUser() after login. */
  initialUser?: AuthUser | null;
  slugId: string;
}

function JobOgPreview({ job, id }: { job: Job; id: string }) {
  const searchParams = useSearchParams();
  if (searchParams.get('debug') !== 'true') return null;
  return (
    <section className="rounded-lg border bg-muted/20 p-4">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
        Obraz OG (podgląd do testów)
      </p>
      <img
        src={`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/jobs/${id}/og-image`}
        alt={job.title}
        className="w-full max-w-[600px] rounded border border-border"
        width={1200}
        height={630}
        style={{ aspectRatio: '1200/630' }}
      />
      {job.ogImageUrl != null && (
        <p className="mt-2 text-xs text-muted-foreground">
          Zapisany w storage (ogImageUrl ustawiony)
        </p>
      )}
    </section>
  );
}

export function JobDetailClient({
  initialJob,
  initialPrevNext,
  initialUser,
  slugId,
}: JobDetailClientProps) {
  const { t, locale } = useTranslations();
  const router = useRouter();
  const [prevNext] = useState<JobPrevNext>(initialPrevNext);
  const [applyMessage, setApplyMessage] = useState('');
  const [applySubmitting, setApplySubmitting] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [lastApplicationMessage, setLastApplicationMessage] = useState<
    string | null
  >(initialJob.currentUserApplicationMessage ?? null);
  const [closeSubmitting, setCloseSubmitting] = useState(false);
  const [acceptSubmitting, setAcceptSubmitting] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectSubmitting, setRejectSubmitting] = useState(false);
  const user = initialUser ?? getStoredUser();
  const applyFormRef = useRef<HTMLDivElement>(null);

  const job = initialJob;
  const id = job.id;

  // After client-side login (e.g. in another tab) we have user from getStoredUser() but no initialUser; refresh once to get fresh job data with token
  const hasRefreshedForUser = useRef(false);
  useEffect(() => {
    if (user && !initialUser && !hasRefreshedForUser.current) {
      hasRefreshedForUser.current = true;
      router.refresh();
    }
  }, [user, initialUser, router]);

  // Fill default message when user is freelancer and can apply (client-only, e.g. after login)
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
  const applications = job.applications ?? [];
  const slotsFull =
    job.expectedOffers != null &&
    applications.length >= job.expectedOffers &&
    !job.currentUserApplied;

  // Whether current user (freelancer) meets job's expected applicant types. When job has no restriction (empty array), true.
  const meetsApplicantCriteria = (() => {
    const allowedTypes = job.expectedApplicantTypes ?? [];
    if (allowedTypes.length === 0) return true;
    if (!user || user.accountType !== 'FREELANCER') return true;
    const hasCompany = !!user.companyId;
    const companySize = user.companySize ?? null;
    const isCompanySize =
      companySize != null &&
      ['MICRO', 'SMALL', 'MEDIUM', 'LARGE'].includes(companySize);
    let userType: string | null = null;
    if (!hasCompany) userType = 'FREELANCER_NO_B2B';
    else if (companySize === 'FREELANCER') userType = 'FREELANCER_B2B';
    else if (isCompanySize) userType = 'COMPANY';
    return (
      userType != null &&
      allowedTypes.includes(
        userType as 'FREELANCER_NO_B2B' | 'FREELANCER_B2B' | 'COMPANY',
      )
    );
  })();

  const canApply =
    user?.accountType === 'FREELANCER' &&
    !isOwnJob &&
    !isDraft &&
    !isClosed &&
    !deadlinePassed &&
    !job.currentUserApplied &&
    !slotsFull &&
    meetsApplicantCriteria;

  /** Freelancer would apply but does not meet job's expected applicant type. */
  const criteriaNotMet =
    user?.accountType === 'FREELANCER' &&
    !isOwnJob &&
    !isDraft &&
    !isClosed &&
    !deadlinePassed &&
    !job.currentUserApplied &&
    !slotsFull &&
    !meetsApplicantCriteria;

  const canClose = (isOwnJob || isAdmin) && !isClosed && !isDraft;

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    if (!id || !canApply) return;
    const messageToSend = applyMessage.trim();
    setLastApplicationMessage(messageToSend || null);
    setApplySubmitting(true);
    setApplyError(null);
    try {
      await applyToJob(id, messageToSend || undefined);
      setApplyMessage('');
      router.refresh();
    } catch (e) {
      setApplyError(e instanceof Error ? e.message : 'Błąd złożenia oferty');
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
      await closeJob(id);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Błąd zamykania oferty');
    } finally {
      setCloseSubmitting(false);
    }
  }

  async function handleAccept() {
    if (!id || !isAdmin || !isDraft) return;
    setAcceptSubmitting(true);
    try {
      await publishJob(id);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Błąd zatwierdzania ogłoszenia');
    } finally {
      setAcceptSubmitting(false);
    }
  }

  function openRejectDialog() {
    setRejectDialogOpen(true);
    setRejectReason('');
  }

  function closeRejectDialog() {
    setRejectDialogOpen(false);
    setRejectReason('');
  }

  async function handleReject() {
    if (!id || !isAdmin || !isDraft || rejectReason.trim().length < 10) return;
    setRejectSubmitting(true);
    try {
      await rejectJob(id, rejectReason.trim());
      closeRejectDialog();
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : t('jobs.failedToReject'));
    } finally {
      setRejectSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-6">
        <div className="lg:col-span-4 space-y-6">
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl lg:text-4xl font-black leading-tight mt-2">
                {job.title}
              </h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Avatar className="h-5 w-5">
                    {job.author.avatarUrl ? (
                      <AvatarImage src={job.author.avatarUrl} alt="" />
                    ) : null}
                    <AvatarFallback className="text-[10px]">
                      {(() => {
                        const n = (job.author.name?.trim() ?? '')
                          .charAt(0)
                          .toUpperCase();
                        const s = (job.author.surname?.trim() ?? '')
                          .charAt(0)
                          .toUpperCase();
                        const e = (job.author.email ?? '?')
                          .charAt(0)
                          .toUpperCase();
                        return n && s ? `${n}${s}` : n || s || e;
                      })()}
                    </AvatarFallback>
                  </Avatar>
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

          <JobMeta
            job={job}
            applicationsCount={applications.length}
            deadlineSoon={deadlineSoon}
            rateValue={<JobRateValue user={user} job={job} t={t} />}
            skills={skills}
            t={t}
          />

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

          {/* OG image for social sharing – test preview only when ?debug=true */}
          <Suspense fallback={null}>
            <JobOgPreview job={job} id={id} />
          </Suspense>

          <JobApplications
            job={job}
            applications={applications}
            user={user}
            isOwnJob={isOwnJob}
            isDraft={isDraft}
            applyFormRef={applyFormRef}
            lastApplicationMessage={
              job.currentUserApplicationMessage ?? lastApplicationMessage
            }
            deadlinePassed={deadlinePassed}
            slotsFull={slotsFull}
            meetsApplicantCriteria={meetsApplicantCriteria}
            onApply={handleApply}
            applyMessage={applyMessage}
            setApplyMessage={setApplyMessage}
            applySubmitting={applySubmitting}
            applyError={applyError}
            locale={locale}
            t={t}
          />
        </div>

        <JobSidebar
          job={job}
          applicationsCount={applications.length}
          deadlineSoon={deadlineSoon}
          t={t}
          actions={
            <JobActions
              isOwnJob={isOwnJob}
              isAdmin={isAdmin}
              isDraft={isDraft}
              isClosed={isClosed}
              user={user}
              canApply={canApply}
              criteriaNotMet={criteriaNotMet}
              currentUserApplied={job.currentUserApplied}
              deadlinePassed={deadlinePassed}
              canClose={canClose}
              closeSubmitting={closeSubmitting}
              onAccept={handleAccept}
              acceptSubmitting={acceptSubmitting}
              onRejectClick={openRejectDialog}
              rejectSubmitting={rejectSubmitting}
              job={job}
              onApplyClick={handleApplyClick}
              onClose={handleClose}
              t={t}
              layout="column"
            />
          }
          rateValue={<JobRateValue user={user} job={job} t={t} />}
        />
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
        criteriaNotMet ||
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
              criteriaNotMet={criteriaNotMet}
              currentUserApplied={job.currentUserApplied}
              deadlinePassed={deadlinePassed}
              canClose={canClose}
              closeSubmitting={closeSubmitting}
              onAccept={handleAccept}
              acceptSubmitting={acceptSubmitting}
              onRejectClick={openRejectDialog}
              rejectSubmitting={rejectSubmitting}
              job={job}
              onApplyClick={handleApplyClick}
              onClose={handleClose}
              t={t}
              layout="row"
            />
          </div>
        </div>
      )}

      <RejectJobDialog
        open={rejectDialogOpen}
        onOpenChange={(open) => !open && closeRejectDialog()}
        reason={rejectReason}
        onReasonChange={setRejectReason}
        onSubmit={handleReject}
        submitting={rejectSubmitting}
        t={t}
      />
    </div>
  );
}
