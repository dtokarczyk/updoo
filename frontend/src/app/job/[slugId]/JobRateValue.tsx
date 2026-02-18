'use client';

import Link from 'next/link';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getRateDisplay } from '@/lib/rate-helpers';
import { jobPath } from '@/lib/job-url';
import type { Job } from '@/lib/api';
import type { getStoredUser } from '@/lib/api';

export interface JobRateValueProps {
  user: ReturnType<typeof getStoredUser>;
  job: Job;
  t: (key: string) => string;
}

export function JobRateValue({ user, job, t }: JobRateValueProps) {
  // Show rate when logged in or when viewing via invitation preview (draft link with hash)
  const canSeeRate = !!user || !!job.invitationToken;
  const rd = getRateDisplay(canSeeRate, job);
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
