import { NotificationFrequency } from '@prisma/client';

/** Default preference when user has no row: enabled + instant. */
export const DEFAULT_ENABLED = true;
export const DEFAULT_FREQUENCY = NotificationFrequency.INSTANT;

export const NOTIFICATION_TYPES = [
  'NEW_JOBS_IN_FOLLOWED_CATEGORIES',
  'NEW_JOB_MATCHING_SKILLS',
  'NEW_APPLICATION_TO_MY_JOB',
] as const;
export const NOTIFICATION_FREQUENCIES = ['INSTANT', 'DAILY_DIGEST'] as const;
