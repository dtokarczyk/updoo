import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';

export const NOTIFICATION_TYPES = ['NEW_JOB_MATCHING_SKILLS'] as const;
export type NotificationTypeValue = (typeof NOTIFICATION_TYPES)[number];

export const NOTIFICATION_FREQUENCIES = ['INSTANT', 'DAILY_DIGEST'] as const;
export type NotificationFrequencyValue =
  (typeof NOTIFICATION_FREQUENCIES)[number];

export class UpdateNotificationPreferenceDto {
  @IsString()
  @IsIn(NOTIFICATION_TYPES, { message: 'validation.notificationTypeInvalid' })
  type!: NotificationTypeValue;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsIn(NOTIFICATION_FREQUENCIES, {
    message: 'validation.notificationFrequencyInvalid',
  })
  frequency?: NotificationFrequencyValue;
}
