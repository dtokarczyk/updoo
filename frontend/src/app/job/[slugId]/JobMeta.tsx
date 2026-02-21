'use client';

import {
  Banknote,
  Briefcase,
  Building2,
  Clock,
  Laptop,
  MapPin,
  Users,
  Wrench,
  BarChart3,
} from 'lucide-react';
import { formatDeadlineRemaining } from '@/lib/deadline-utils';
import { cn } from '@/lib/utils';
import type { Job } from '@/lib/api';

const BILLING_LABELS: Record<string, string> = {
  FIXED: 'Ryczałt',
  HOURLY: 'Godzinowo',
};

const HOURS_LABELS: Record<string, string> = {
  LESS_THAN_10: '< 10 h/tydz.',
  FROM_11_TO_20: '11-20 h/tydz.',
  FROM_21_TO_30: '21-30 h/tydz.',
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

const EXPECTED_APPLICANT_TYPE_KEYS: Record<string, string> = {
  FREELANCER_NO_B2B: 'jobs.newJobForm.expectedApplicantTypeFreelancerNoB2B',
  FREELANCER_B2B: 'jobs.newJobForm.expectedApplicantTypeFreelancerB2B',
  COMPANY: 'jobs.newJobForm.expectedApplicantTypeCompany',
};

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

export interface JobMetaProps {
  job: Job;
  applicationsCount: number;
  deadlineSoon: boolean;
  rateValue: React.ReactNode;
  skills: string[];
  t: (key: string, params?: Record<string, string | number>) => string;
}

export function JobMeta({
  job,
  applicationsCount,
  deadlineSoon,
  rateValue,
  skills,
  t,
}: JobMetaProps) {
  return (
    <>
      <section className="block lg:hidden space-y-6 border-t pt-6">
        <DetailRow icon={Banknote} label={t('jobs.rate')} value={rateValue} />
        {job.expectedOffers != null ? (
          <>
            <DetailRow
              icon={Users}
              label={t('jobs.expectedOffers')}
              value={String(job.expectedOffers)}
            />
            <DetailRow
              icon={Users}
              label={t('jobs.submittedApplications')}
              value={String(applicationsCount)}
            />
          </>
        ) : (
          <DetailRow
            icon={Users}
            label={t('jobs.applications')}
            value={String(applicationsCount)}
          />
        )}

        {job.expectedApplicantTypes != null &&
          job.expectedApplicantTypes.length > 0 && (
            <DetailRow
              icon={Building2}
              label={t('jobs.expectedApplicantType')}
              value={job.expectedApplicantTypes
                .map((type) => t(EXPECTED_APPLICANT_TYPE_KEYS[type] ?? type))
                .join(', ')}
            />
          )}

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
          value={EXPERIENCE_LABELS[job.experienceLevel] ?? job.experienceLevel}
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
    </>
  );
}
