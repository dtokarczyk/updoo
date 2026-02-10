import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { GetUser } from '../auth/get-user.decorator';
import type { JwtUser } from '../auth/get-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AgreementsAcceptedGuard } from '../auth/agreements-accepted.guard';
import { NotificationsService } from './notifications.service';
import { UpdateNotificationPreferenceDto } from './dto/update-notification-preference.dto';
import { NotificationType, NotificationFrequency } from '@prisma/client';

@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
  ) {}

  /** Get all notification preferences for the authenticated user. */
  @Get('preferences')
  @UseGuards(JwtAuthGuard, AgreementsAcceptedGuard)
  getPreferences(@GetUser() user: JwtUser) {
    return this.notificationsService.getPreferences(user.id);
  }

  /** Update a single notification preference. */
  @Patch('preferences')
  @UseGuards(JwtAuthGuard, AgreementsAcceptedGuard)
  updatePreference(
    @GetUser() user: JwtUser,
    @Body() dto: UpdateNotificationPreferenceDto,
  ) {
    return this.notificationsService.updatePreference(
      user.id,
      dto.type as NotificationType,
      dto.enabled,
      dto.frequency as NotificationFrequency | undefined,
    );
  }
}
