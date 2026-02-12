import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';
import {
  NOTIFICATION_TYPES,
  NOTIFICATION_FREQUENCIES,
  type NotificationTypeValue,
  type NotificationFrequencyValue,
} from '../constants';

export { NOTIFICATION_TYPES, NOTIFICATION_FREQUENCIES };
export type { NotificationTypeValue, NotificationFrequencyValue };

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
