'use client';

import Link from 'next/link';
import { Check, Pencil, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { jobPath, jobPathEdit } from '@/lib/job-url';
import type { Job } from '@/lib/api';
import type { getStoredUser } from '@/lib/api';

export interface JobActionsProps {
  isOwnJob: boolean;
  isAdmin: boolean;
  isDraft: boolean;
  isClosed: boolean;
  user: ReturnType<typeof getStoredUser>;
  canApply: boolean;
  /** True when freelancer would apply but does not meet job's expected applicant type. */
  criteriaNotMet: boolean;
  currentUserApplied: boolean | undefined;
  deadlinePassed: boolean;
  canClose: boolean;
  closeSubmitting: boolean;
  /** Admin-only: accept (publish) draft job. Shown when isAdmin && isDraft. */
  onAccept?: () => void;
  acceptSubmitting?: boolean;
  job: Job;
  onApplyClick: () => void;
  onClose: () => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  layout?: 'column' | 'row';
}

export function JobActions({
  isOwnJob,
  isAdmin,
  isDraft,
  isClosed,
  user,
  canApply,
  criteriaNotMet,
  currentUserApplied,
  deadlinePassed,
  canClose,
  closeSubmitting,
  onAccept,
  acceptSubmitting = false,
  job,
  onApplyClick,
  onClose,
  t,
  layout = 'column',
}: JobActionsProps) {
  const isOwnerOrAdmin = isOwnJob || isAdmin;
  const canAccept = isAdmin && isDraft && onAccept;
  const isFreelancerCanSee =
    !isDraft && !isClosed && user?.accountType === 'FREELANCER';
  const isGuestApplyCta = !user && !isDraft && !isClosed;

  if (!isOwnerOrAdmin && !isFreelancerCanSee && !isGuestApplyCta) {
    return null;
  }

  const containerClassName =
    layout === 'row' ? 'flex flex-wrap gap-2' : 'space-y-2';
  const buttonWidthClass = layout === 'row' ? 'flex-1 min-w-0' : 'w-full';
  const loginUrl = `/login?returnUrl=${encodeURIComponent(jobPath(job))}`;

  return (
    <div className={containerClassName}>
      {isOwnerOrAdmin ? (
        <>
          {canAccept && (
            <Button
              className={buttonWidthClass}
              size="lg"
              onClick={onAccept}
              disabled={acceptSubmitting}
            >
              <Check className="mr-2 h-4 w-4" />
              {acceptSubmitting ? t('admin.approving') : t('admin.approve')}
            </Button>
          )}
          <Button className={buttonWidthClass} size="lg" asChild>
            <Link href={jobPathEdit(job)}>
              <Pencil className="mr-2 h-4 w-4" />
              {t('jobs.edit')}
            </Link>
          </Button>
          {canClose && (
            <Button
              className={buttonWidthClass}
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
        <Button className={buttonWidthClass} size="lg" asChild>
          <Link href={loginUrl}>
            <Send className="mr-2 h-4 w-4" />
            {t('jobs.apply')}
          </Link>
        </Button>
      ) : canApply ? (
        <Button onClick={onApplyClick} className={buttonWidthClass} size="lg">
          <Send className="mr-2 h-4 w-4" />
          {t('jobs.apply')}
        </Button>
      ) : currentUserApplied === true ? (
        <Button
          disabled
          className={buttonWidthClass}
          size="lg"
          variant="outline"
        >
          {t('jobs.appliedShort')}
        </Button>
      ) : criteriaNotMet ? (
        <div
          className={
            layout === 'row'
              ? 'flex flex-1 min-w-0 flex-col gap-1.5'
              : 'space-y-1.5 w-full'
          }
        >
          <Button
            disabled
            className={buttonWidthClass}
            size="lg"
            variant="outline"
          >
            <Send className="mr-2 h-4 w-4" />
            {t('jobs.apply')}
          </Button>
          <p className="text-sm text-muted-foreground px-1">
            {t('jobs.applyCriteriaNotMet')}
          </p>
        </div>
      ) : deadlinePassed ? (
        <Button
          disabled
          className={buttonWidthClass}
          size="lg"
          variant="outline"
        >
          {t('jobs.deadlinePassed')}
        </Button>
      ) : (
        <Button onClick={onApplyClick} className={buttonWidthClass} size="lg">
          <Send className="mr-2 h-4 w-4" />
          {t('jobs.apply')}
        </Button>
      )}
    </div>
  );
}
