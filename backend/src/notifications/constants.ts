import { NotificationFrequency } from '@prisma/client';

/** Default preference when user has no row: enabled + instant. */
export const DEFAULT_ENABLED = true;
export const DEFAULT_FREQUENCY = NotificationFrequency.INSTANT;

export const NOTIFICATION_TYPES = ['NEW_JOB_MATCHING_SKILLS'] as const;
export type NotificationTypeValue = (typeof NOTIFICATION_TYPES)[number];

export const NOTIFICATION_FREQUENCIES = ['INSTANT', 'DAILY_DIGEST'] as const;
export type NotificationFrequencyValue =
  (typeof NOTIFICATION_FREQUENCIES)[number];
