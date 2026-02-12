import { NOTIFICATION_FREQUENCIES, NOTIFICATION_TYPES } from './constants';

export type NotificationTypeValue = (typeof NOTIFICATION_TYPES)[number];
export type NotificationFrequencyValue =
  (typeof NOTIFICATION_FREQUENCIES)[number];
